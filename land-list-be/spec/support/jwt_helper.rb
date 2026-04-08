module JwtHelper
  def jwt_for(user)
    JWT.encode({ sub: user.id, exp: 1.hour.from_now.to_i }, ENV.fetch("JWT_SECRET"), JwtAuth::JWT_ALG)
  end
end
