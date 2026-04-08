# Sample data for local development. Idempotent: clears existing rows then recreates.

puts "Clearing tables…"
[ WatchlistItem, SearchHistory, Room, Property, User ].each(&:delete_all)

geo = RGeo::Geographic.spherical_factory(srid: 4326)

def point(geo, lng, lat)
  geo.point(lng, lat)
end

PASSWORD = "password123"

users = [
  User.create!(email: "demo@example.com", password: PASSWORD, password_confirmation: PASSWORD),
  User.create!(email: "alice@example.com", password: PASSWORD, password_confirmation: PASSWORD),
  User.create!(email: "bob@example.com", password: PASSWORD, password_confirmation: PASSWORD)
]

puts "Created #{users.size} users (password for all: #{PASSWORD})"

listings = [
  {
    title: "Oak Ridge Building Lot",
    description: "Level corner lot with utilities at the street. Zoned residential.",
    property_type: "LAND",
    price_cents: 125_000_00,
    selling_status: "FOR_SALE",
    bedrooms: 0,
    bathrooms: 0,
    sqft: nil,
    address: "1200 Ridge Rd",
    city: "Austin",
    state: "TX",
    country: "US",
    lonlat: point(geo, -97.7431, 30.2672)
  },
  {
    title: "Sunset View Townhome",
    description: "End unit with small yard and two-car garage.",
    property_type: "TOWNHOUSE",
    price_cents: 485_000_00,
    selling_status: "FOR_SALE",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1840,
    address: "88 Palm Ave",
    city: "San Diego",
    state: "CA",
    country: "US",
    lonlat: point(geo, -117.1611, 32.7157)
  },
  {
    title: "Downtown Loft Apartment",
    description: "Walk to transit. High ceilings, in-unit laundry.",
    property_type: "APARTMENT",
    price_cents: 625_000_00,
    selling_status: "FOR_SALE",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    address: "400 Market St",
    city: "Denver",
    state: "CO",
    country: "US",
    lonlat: point(geo, -104.9903, 39.7392)
  },
  {
    title: "Craftsman House with Porch",
    description: "Mature trees, updated kitchen, unfinished basement.",
    property_type: "HOUSE",
    price_cents: 412_500_00,
    selling_status: "PENDING",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2450,
    address: "221 Maple Dr",
    city: "Portland",
    state: "OR",
    country: "US",
    lonlat: point(geo, -122.6765, 45.5152)
  },
  {
    title: "Waterfront Condo",
    description: "Harbor views, concierge, gym and pool.",
    property_type: "CONDO",
    price_cents: 899_000_00,
    selling_status: "FOR_SALE",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1350,
    address: "10 Harbor Way",
    city: "Miami",
    state: "FL",
    country: "US",
    lonlat: point(geo, -80.1918, 25.7617)
  },
  {
    title: "Industrial Land Parcel",
    description: "2.4 acres, light industrial zoning.",
    property_type: "LAND",
    price_cents: 310_000_00,
    selling_status: "FOR_SALE",
    bedrooms: 0,
    bathrooms: 0,
    sqft: nil,
    address: "Industrial Blvd & 5th",
    city: "Phoenix",
    state: "AZ",
    country: "US",
    lonlat: point(geo, -112.0740, 33.4484)
  },
  {
    title: "Suburban Ranch",
    description: "Single story, fenced yard, near schools.",
    property_type: "HOUSE",
    price_cents: 359_900_00,
    selling_status: "FOR_SALE",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1680,
    address: "55 Cedar Ln",
    city: "Nashville",
    state: "TN",
    country: "US",
    lonlat: point(geo, -86.7816, 36.1627)
  },
  {
    title: "Lake Lot — Survey Available",
    description: "Wooded lot with deeded lake access.",
    property_type: "LAND",
    price_cents: 79_500_00,
    selling_status: "FOR_SALE",
    bedrooms: 0,
    bathrooms: 0,
    sqft: nil,
    address: "Lot 7 Lake Rd",
    city: "Asheville",
    state: "NC",
    country: "US",
    lonlat: point(geo, -82.5515, 35.5951)
  },
  {
    title: "Sold — Row Home",
    description: "Recently sold; shown for history.",
    property_type: "TOWNHOUSE",
    price_cents: 525_000_00,
    selling_status: "SOLD",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1725,
    address: "900 N Broad St",
    city: "Philadelphia",
    state: "PA",
    country: "US",
    lonlat: point(geo, -75.1652, 39.9526)
  },
  {
    title: "Off-Market Studio",
    description: "Temporarily withdrawn.",
    property_type: "APARTMENT",
    price_cents: 310_000_00,
    selling_status: "OFF_MARKET",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 620,
    address: "12 Beacon St",
    city: "Boston",
    state: "MA",
    country: "US",
    lonlat: point(geo, -71.0589, 42.3601)
  }
]

properties = listings.each_with_index.map do |attrs, i|
  owner = users[i % users.size]
  Property.create!(attrs.merge(user: owner))
end
puts "Created #{properties.size} base properties"

# Ten additional listings per user (30 total) for browsing / my-listings demos
extra_locations = [
  { city: "Seattle", state: "WA", lng: -122.3321, lat: 47.6062 },
  { city: "Chicago", state: "IL", lng: -87.6298, lat: 41.8781 },
  { city: "Atlanta", state: "GA", lng: -84.3880, lat: 33.7490 },
  { city: "Dallas", state: "TX", lng: -96.7970, lat: 32.7767 },
  { city: "Minneapolis", state: "MN", lng: -93.2650, lat: 44.9778 },
  { city: "Salt Lake City", state: "UT", lng: -111.8910, lat: 40.7608 },
  { city: "Tucson", state: "AZ", lng: -110.9747, lat: 32.2226 },
  { city: "Kansas City", state: "MO", lng: -94.5786, lat: 39.0997 },
  { city: "Charlotte", state: "NC", lng: -80.8431, lat: 35.2271 },
  { city: "Las Vegas", state: "NV", lng: -115.1398, lat: 36.1699 }
]
types = Property::PROPERTY_TYPES
statuses = Property::SELLING_STATUSES

extra_count = 0
users.each do |user|
  slug = user.email.split("@").first
  10.times do |i|
    loc = extra_locations[i]
    idx = extra_count
    extra_count += 1
    lng = loc[:lng] + (i * 0.04) + (user.id * 0.01)
    lat = loc[:lat] + (i * 0.03)
    Property.create!(
      user: user,
      title: "#{slug.capitalize} listing ##{i + 1} — #{loc[:city]}",
      description: "Additional seed property ##{i + 1} for #{user.email}. Good for testing filters and pagination.",
      property_type: types[idx % types.size],
      price_cents: (95_000 + (idx * 23_117 % 750_000)) * 100,
      selling_status: statuses[idx % statuses.size],
      bedrooms: idx % 7,
      bathrooms: idx % 5,
      sqft: 400 + (idx * 137 % 4000),
      address: "#{100 + i * 11} Sample St",
      city: loc[:city],
      state: loc[:state],
      country: "US",
      lonlat: point(geo, lng, lat)
    )
  end
end
puts "Added #{extra_count} extra properties (10 per user)"

# Optional rooms on a couple of listings
demo_house = properties.find { |p| p.title.include?("Craftsman") }
if demo_house
  Room.create!(property: demo_house, name: "Living room", room_type: "LIVING", area_sqft: 320)
  Room.create!(property: demo_house, name: "Kitchen", room_type: "KITCHEN", area_sqft: 180)
end

# Watchlist: demo user saves a few listings
demo = users.find { |u| u.email == "demo@example.com" }
if demo
  properties.first(3).each do |prop|
    WatchlistItem.create!(user: demo, property: prop)
  end
  puts "Added #{demo.watchlist_items.count} watchlist items for #{demo.email}"
end

puts "Done."
