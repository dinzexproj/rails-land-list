module JwtAuth
  extend ActiveSupport::Concern

  JWT_ALG = "HS256"

  included do
    before_action :authenticate!
    attr_reader :current_user
  end

  private

  def authenticate!
    token = bearer_token
    return render_unauthorized("missing_token") if token.blank?

    payload = decode_token(token)
    @current_user = User.find(payload.fetch("sub"))
  rescue JWT::DecodeError, KeyError, ActiveRecord::RecordNotFound
    render_unauthorized("invalid_token")
  end

  def bearer_token
    header = request.headers["Authorization"].to_s
    scheme, token = header.split(" ", 2)
    return if scheme != "Bearer"
    token
  end

  def jwt_secret
    ENV.fetch("JWT_SECRET")
  end

  def encode_token(user_id:, exp: 24.hours.from_now)
    JWT.encode({ sub: user_id, exp: exp.to_i }, jwt_secret, JWT_ALG)
  end

  def decode_token(token)
    JWT.decode(token, jwt_secret, true, { algorithm: JWT_ALG }).first
  end

  def render_unauthorized(reason)
    render json: { error: "unauthorized", reason: reason }, status: :unauthorized
  end

  def authenticate_optional!
    token = bearer_token
    @current_user = nil
    return if token.blank?

    payload = decode_token(token)
    @current_user = User.find(payload.fetch("sub"))
  rescue JWT::DecodeError, KeyError, ActiveRecord::RecordNotFound
    @current_user = nil
  end
end
