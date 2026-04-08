class Api::WatchlistItemsController < Api::BaseController
  def create
    property = Property.find(params.require(:property_id))
    item = current_user.watchlist_items.create!(property: property)
    render json: { id: item.id, property_id: property.id }, status: :created
  end

  def destroy
    item = current_user.watchlist_items.find_by!(property_id: params[:property_id])
    item.destroy!
    head :no_content
  end
end
