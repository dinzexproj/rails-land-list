require "rails_helper"

RSpec.describe "Watchlist", type: :request do
  it "adds and removes a property from watchlist" do
    user = create(:user)
    property = create(:property)

    post "/api/watchlist/items", params: { property_id: property.id }, headers: {
      "Authorization" => "Bearer #{jwt_for(user)}"
    }
    expect(response).to have_http_status(:created)

    get "/api/watchlist", headers: { "Authorization" => "Bearer #{jwt_for(user)}" }
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["properties"].map { |p| p["id"] }).to include(property.id)

    delete "/api/watchlist/items/#{property.id}", headers: { "Authorization" => "Bearer #{jwt_for(user)}" }
    expect(response).to have_http_status(:no_content)
  end
end
