class Api::WatchlistController < Api::BaseController
  def show
    properties = current_user.watched_properties.order("watchlist_items.created_at DESC")
    render json: {
      properties: properties.map { |p| watchlist_property_json(p) }
    }
  end

  private

  def watchlist_property_json(property)
    {
      id: property.id,
      user_id: property.user_id,
      title: property.title,
      property_type: property.property_type,
      price_cents: property.price_cents,
      selling_status: property.selling_status,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      city: property.city,
      state: property.state,
      image_url: property.listing_image_url
    }
  end
end
