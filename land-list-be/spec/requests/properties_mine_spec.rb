require "rails_helper"

RSpec.describe "Properties mine index", type: :request do
  it "returns 401 when mine is requested without authentication" do
    create(:property)

    get "/api/properties", params: { mine: true }

    expect(response).to have_http_status(:unauthorized)
  end

  it "returns only the current user's listings when mine is true" do
    alice = create(:user)
    bob = create(:user)
    create_list(:property, 2, user: alice)
    create_list(:property, 3, user: bob)

    get "/api/properties", params: { mine: true, per_page: 20, page: 1 }, headers: {
      "Authorization" => "Bearer #{jwt_for(alice)}"
    }

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["properties"].length).to eq(2)
    expect(body["properties"].map { |p| p["user_id"] }.uniq).to eq([ alice.id ])
  end
end
