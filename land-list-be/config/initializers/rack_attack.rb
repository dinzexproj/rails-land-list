Rails.application.config.middleware.use Rack::Attack

# For now use in-process store (works in dev/test).
# In production we recommend a shared cache (Redis/Memcached) for consistent limits.
Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

# Basic rate limiting: 5 requests per 60s per IP for auth endpoints.
Rack::Attack.throttle("auth/ip", limit: 5, period: 60) do |req|
  next unless req.path.start_with?("/api/auth/")
  req.ip
end

ActiveSupport::Notifications.subscribe("rack.attack") do |_, _, _, _, payload|
  Rails.logger.debug { "[rack-attack] #{payload.inspect}" }
end
