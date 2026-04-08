class Api::Auth::SessionsController < Api::BaseController
  # Login uses HTTP Basic (email:password) and returns a JWT.
  # Logout does not require a valid JWT (client may discard an expired token); destroy is a no-op for stateless sessions.
  # Rate limiting is enforced by Rack::Attack.
  skip_before_action :authenticate!, only: %i[create destroy]

  def create
    email, password = basic_credentials
    return render json: { error: "missing_basic_auth" }, status: :unauthorized if email.blank? || password.blank?

    user = User.find_by(email: email.to_s.downcase)

    if user&.authenticate(password)
      token = encode_token(user_id: user.id)
      render json: { token: token, user: { id: user.id, email: user.email } }
    else
      render json: { error: "invalid_credentials" }, status: :unauthorized
    end
  end

  def destroy
    head :no_content
  end

  private

  def encode_token(user_id:, exp: 24.hours.from_now)
    JWT.encode({ sub: user_id, exp: exp.to_i }, ENV.fetch("JWT_SECRET"), JwtAuth::JWT_ALG)
  end

  def basic_credentials
    auth = ActionController::HttpAuthentication::Basic.user_name_and_password(request)
    return [ nil, nil ] if auth.blank?
    auth
  end
end
