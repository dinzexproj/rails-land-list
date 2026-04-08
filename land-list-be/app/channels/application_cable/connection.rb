module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      token = request.params["token"].to_s
      raise ActionCable::Connection::Authorization::UnauthorizedError if token.blank?

      payload = JWT.decode(token, ENV.fetch("JWT_SECRET"), true, { algorithm: JwtAuth::JWT_ALG }).first
      User.find(payload.fetch("sub"))
    rescue JWT::DecodeError, KeyError, ActiveRecord::RecordNotFound
      raise ActionCable::Connection::Authorization::UnauthorizedError
    end
  end
end
