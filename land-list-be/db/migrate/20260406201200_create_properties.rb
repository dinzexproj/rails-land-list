class CreateProperties < ActiveRecord::Migration[8.1]
  def change
    create_table :properties do |t|
      t.string :title, null: false
      t.text :description
      t.string :property_type, null: false
      t.bigint :price_cents, null: false
      t.string :selling_status, null: false
      t.integer :bedrooms, null: false, default: 0
      t.integer :bathrooms, null: false, default: 0
      t.integer :sqft
      t.string :address
      t.string :city, null: false
      t.string :state, null: false
      t.string :country
      t.st_point :lonlat, geographic: true, null: false

      t.timestamps
    end

    add_index :properties, :property_type
    add_index :properties, :selling_status
    add_index :properties, :price_cents
    add_index :properties, :bedrooms
    add_index :properties, :city
    add_index :properties, :state
    add_index :properties, :lonlat, using: :gist
  end
end
