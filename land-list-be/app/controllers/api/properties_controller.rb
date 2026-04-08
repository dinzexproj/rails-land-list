class Api::PropertiesController < Api::BaseController
  skip_before_action :authenticate!, only: %i[index show]
  before_action :authenticate_optional!, only: %i[index show]
  before_action :authenticate!, only: %i[create update destroy]
  before_action :set_property, only: %i[show update destroy]
  before_action :authorize_owner!, only: %i[update destroy]

  def index
    if mine_requested?
      return render json: { error: "unauthorized", reason: "missing_token" }, status: :unauthorized if current_user.blank?

      scope = current_user.properties
    else
      scope = Property.all
    end

    scope = scope.where("price_cents >= ?", params[:min_price_cents].to_i) if params[:min_price_cents].present?
    scope = scope.where("price_cents <= ?", params[:max_price_cents].to_i) if params[:max_price_cents].present?
    scope = scope.where(bedrooms: params[:bedrooms].to_i) if params[:bedrooms].present?
    scope = scope.where(property_type: params[:property_type].to_s.upcase) if params[:property_type].present?
    scope = scope.where(selling_status: params[:selling_status].to_s.upcase) if params[:selling_status].present?

    if params[:lat].present? && params[:lng].present? && params[:distance_km].present?
      lat = params[:lat].to_f
      lng = params[:lng].to_f
      meters = (params[:distance_km].to_f * 1000.0).to_i

      scope = scope.where(
        "ST_DWithin(properties.lonlat, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)",
        lng, lat, meters
      ).order(
        Arel.sql("ST_Distance(properties.lonlat, ST_SetSRID(ST_MakePoint(#{lng}, #{lat}), 4326)::geography) ASC")
      )
    else
      scope = scope.order(created_at: :desc)
    end

    save_search_history!(request.query_parameters) unless mine_requested?

    paginated = scope.page(params[:page]).per(per_page)
    render json: {
      properties: paginated.map { |p| property_json(p) },
      page: paginated.current_page,
      per_page: paginated.limit_value,
      total_pages: paginated.total_pages,
      total_count: paginated.total_count
    }
  end

  def show
    render json: property_json(@property, include_rooms: true)
  end

  def create
    if params[:lat].blank? || params[:lng].blank?
      return render json: { error: "bad_request", message: "lat and lng are required" }, status: :bad_request
    end

    property = current_user.properties.build(property_attributes)
    property.lonlat = build_point(params[:lng], params[:lat])
    if property.save
      sync_rooms!(property, rooms_param)
      render json: property_json(property.reload, include_rooms: true), status: :created
    else
      render json: { error: "validation_error", messages: property.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    attrs = property_attributes
    if params[:lat].present? && params[:lng].present?
      attrs = attrs.merge(lonlat: build_point(params[:lng], params[:lat]))
    end
    if @property.update(attrs)
      sync_rooms!(@property, rooms_param) unless rooms_param.nil?
      render json: property_json(@property.reload, include_rooms: true)
    else
      render json: { error: "validation_error", messages: @property.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @property.destroy!
    head :no_content
  end

  private

  def mine_requested?
    v = params[:mine]
    return false if v.blank?

    ActiveModel::Type::Boolean.new.cast(v)
  end

  def set_property
    @property = Property.includes(:rooms).find(params[:id])
  end

  def authorize_owner!
    return if @property.user_id == current_user.id

    render json: { error: "forbidden", message: "You can only modify your own listings." }, status: :forbidden
  end

  def per_page
    per = params[:per_page].to_i
    return 20 if per <= 0
    [ per, 50 ].min
  end

  def save_search_history!(query)
    return if current_user.blank?

    SearchHistory.create!(user: current_user, query: query)
  rescue ActiveRecord::RecordInvalid
    # Non-critical: don't fail searches if history can't be saved.
    nil
  end

  def permitted_payload
    @permitted_payload ||= params.permit(
      :title, :description, :property_type, :price_cents, :selling_status,
      :bedrooms, :bathrooms, :sqft, :address, :city, :state, :country,
      :lat, :lng,
      rooms: %i[name room_type area_sqft]
    )
  end

  def property_attributes
    permitted_payload.except(:lat, :lng, :rooms).to_h.symbolize_keys
  end

  def rooms_param
    return nil unless params.key?(:rooms)

    permitted_payload[:rooms]
  end

  def build_point(lng, lat)
    geo = RGeo::Geographic.spherical_factory(srid: 4326)
    geo.point(lng.to_f, lat.to_f)
  end

  def sync_rooms!(property, rooms_data)
    return if rooms_data.nil?

    unless rooms_data.is_a?(Array)
      raise ActionController::ParameterMissing, "rooms must be an array"
    end

    property.rooms.destroy_all
    rooms_data.each do |room|
      h = room.respond_to?(:to_unsafe_h) ? room.to_unsafe_h : room
      next unless h.is_a?(Hash)

      attrs = h.stringify_keys.slice("name", "room_type", "area_sqft")
      next if attrs["name"].blank? || attrs["room_type"].blank?

      area = attrs["area_sqft"]
      property.rooms.create!(
        name: attrs["name"],
        room_type: attrs["room_type"],
        area_sqft: area.present? ? area.to_i : nil
      )
    end
  end

  def property_json(property, include_rooms: false)
    json = {
      id: property.id,
      user_id: property.user_id,
      title: property.title,
      description: property.description,
      property_type: property.property_type,
      price_cents: property.price_cents,
      selling_status: property.selling_status,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      created_at: property.created_at,
      updated_at: property.updated_at,
      image_url: property.listing_image_url
    }

    if property.lonlat.present?
      json[:lat] = property.lonlat.latitude
      json[:lng] = property.lonlat.longitude
    end

    if include_rooms
      json[:rooms] = property.rooms.map do |r|
        { id: r.id, name: r.name, room_type: r.room_type, area_sqft: r.area_sqft }
      end
    end

    json
  end
end
