# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_07_100000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "postgis"

  create_table "properties", force: :cascade do |t|
    t.string "address"
    t.integer "bathrooms", default: 0, null: false
    t.integer "bedrooms", default: 0, null: false
    t.string "city", null: false
    t.string "country"
    t.datetime "created_at", null: false
    t.text "description"
    t.geography "lonlat", limit: {srid: 4326, type: "st_point", geographic: true}, null: false
    t.bigint "price_cents", null: false
    t.string "property_type", null: false
    t.string "selling_status", null: false
    t.integer "sqft"
    t.string "state", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["bedrooms"], name: "index_properties_on_bedrooms"
    t.index ["city"], name: "index_properties_on_city"
    t.index ["lonlat"], name: "index_properties_on_lonlat", using: :gist
    t.index ["price_cents"], name: "index_properties_on_price_cents"
    t.index ["property_type"], name: "index_properties_on_property_type"
    t.index ["selling_status"], name: "index_properties_on_selling_status"
    t.index ["state"], name: "index_properties_on_state"
    t.index ["user_id"], name: "index_properties_on_user_id"
  end

  create_table "rooms", force: :cascade do |t|
    t.integer "area_sqft"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "property_id", null: false
    t.string "room_type", null: false
    t.datetime "updated_at", null: false
    t.index ["property_id", "room_type"], name: "index_rooms_on_property_id_and_room_type"
    t.index ["property_id"], name: "index_rooms_on_property_id"
  end

  create_table "search_histories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "query", default: {}, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["created_at"], name: "index_search_histories_on_created_at"
    t.index ["query"], name: "index_search_histories_on_query", using: :gin
    t.index ["user_id"], name: "index_search_histories_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "watchlist_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "property_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["property_id"], name: "index_watchlist_items_on_property_id"
    t.index ["user_id", "property_id"], name: "index_watchlist_items_on_user_id_and_property_id", unique: true
    t.index ["user_id"], name: "index_watchlist_items_on_user_id"
  end

  add_foreign_key "properties", "users"
  add_foreign_key "rooms", "properties"
  add_foreign_key "search_histories", "users"
  add_foreign_key "watchlist_items", "properties"
  add_foreign_key "watchlist_items", "users"
end
