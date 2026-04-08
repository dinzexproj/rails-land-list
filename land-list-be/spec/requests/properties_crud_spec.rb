require "rails_helper"

RSpec.describe "Properties CRUD", type: :request do
  let(:owner) { create(:user) }
  let(:other) { create(:user) }
  let(:property) { create(:property, user: owner) }

  describe "POST /api/properties" do
    it "creates a listing for the authenticated user" do
      expect do
        post "/api/properties",
             params: {
               title: "New Lot",
               description: "Nice land",
               property_type: "LAND",
               price_cents: 50_000_00,
               selling_status: "FOR_SALE",
               bedrooms: 0,
               bathrooms: 0,
               city: "Austin",
               state: "TX",
               country: "US",
               lat: 30.2672,
               lng: -97.7431
             }.to_json,
             headers: {
               "Authorization" => "Bearer #{jwt_for(owner)}",
               "Content-Type" => "application/json"
             }
      end.to change(Property, :count).by(1)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["title"]).to eq("New Lot")
      expect(body["user_id"]).to eq(owner.id)
      expect(body["lat"]).to be_within(0.0001).of(30.2672)
      expect(body["lng"]).to be_within(0.0001).of(-97.7431)
    end

    it "rejects create without coordinates" do
      post "/api/properties",
           params: {
             title: "X",
             property_type: "LAND",
             price_cents: 1,
             selling_status: "FOR_SALE",
             bedrooms: 0,
             bathrooms: 0,
             city: "A",
             state: "TX"
           }.to_json,
           headers: {
             "Authorization" => "Bearer #{jwt_for(owner)}",
             "Content-Type" => "application/json"
           }

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "PATCH /api/properties/:id" do
    it "allows the owner to update" do
      patch "/api/properties/#{property.id}",
            params: { title: "Updated Title", lat: 40.0, lng: -105.0 }.to_json,
            headers: {
              "Authorization" => "Bearer #{jwt_for(owner)}",
              "Content-Type" => "application/json"
            }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["title"]).to eq("Updated Title")
      property.reload
      expect(property.title).to eq("Updated Title")
    end

    it "forbids non-owners" do
      patch "/api/properties/#{property.id}",
            params: { title: "Hacked" }.to_json,
            headers: {
              "Authorization" => "Bearer #{jwt_for(other)}",
              "Content-Type" => "application/json"
            }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/properties/:id" do
    it "allows the owner to delete" do
      p = property
      expect do
        delete "/api/properties/#{p.id}",
               headers: { "Authorization" => "Bearer #{jwt_for(owner)}" }
      end.to change(Property, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "forbids non-owners" do
      delete "/api/properties/#{property.id}",
             headers: { "Authorization" => "Bearer #{jwt_for(other)}" }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
