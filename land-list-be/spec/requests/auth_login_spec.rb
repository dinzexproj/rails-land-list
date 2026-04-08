require "rails_helper"

RSpec.describe "Auth login", type: :request do
  it "returns a JWT for valid credentials" do
    user = create(:user, password: "password123!")

    post "/api/auth/login", headers: {
      "Authorization" => ActionController::HttpAuthentication::Basic.encode_credentials(user.email, "password123!")
    }

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["token"]).to be_present
    expect(body.dig("user", "email")).to eq(user.email)
  end

  it "rejects invalid credentials" do
    user = create(:user, password: "password123!")

    post "/api/auth/login", headers: {
      "Authorization" => ActionController::HttpAuthentication::Basic.encode_credentials(user.email, "wrong")
    }

    expect(response).to have_http_status(:unauthorized)
  end

  it "allows logout without a Bearer token (client may discard expired JWT)" do
    delete "/api/auth/logout"

    expect(response).to have_http_status(:no_content)
  end
end
