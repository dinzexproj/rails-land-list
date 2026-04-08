FactoryBot.define do
  factory :property do
    user

    title { Faker::Address.community }
    description { Faker::Lorem.paragraph }
    property_type { Property::PROPERTY_TYPES.sample }
    price_cents { Faker::Number.between(from: 50_000_00, to: 900_000_00) }
    selling_status { "FOR_SALE" }
    bedrooms { Faker::Number.between(from: 0, to: 6) }
    bathrooms { Faker::Number.between(from: 0, to: 4) }
    sqft { Faker::Number.between(from: 300, to: 5000) }
    address { Faker::Address.street_address }
    city { Faker::Address.city }
    state { Faker::Address.state_abbr }
    country { "US" }

    lonlat do
      factory = RGeo::Geographic.spherical_factory(srid: 4326)
      factory.point(-122.4194, 37.7749)
    end
  end
end
