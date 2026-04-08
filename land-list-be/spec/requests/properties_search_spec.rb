require "rails_helper"

RSpec.describe "Properties search", type: :request do
  it "returns paginated results for authenticated user" do
    user = create(:user)
    create_list(:property, 3, price_cents: 100_00, bedrooms: 2, property_type: "HOUSE", selling_status: "FOR_SALE")

    get "/api/properties", params: { per_page: 2, page: 1 }, headers: {
      "Authorization" => "Bearer #{jwt_for(user)}"
    }

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["properties"].length).to eq(2)
    expect(body["page"]).to eq(1)
  end
end
