class Api::SearchHistoriesController < Api::BaseController
  def index
    histories = current_user.search_histories.order(created_at: :desc).limit(limit)
    render json: {
      items: histories.map { |h| { id: h.id, query: h.query, created_at: h.created_at } }
    }
  end

  private

  def limit
    l = params[:limit].to_i
    return 25 if l <= 0
    [ l, 100 ].min
  end
end
