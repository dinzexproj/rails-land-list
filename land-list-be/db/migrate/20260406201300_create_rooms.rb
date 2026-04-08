class CreateRooms < ActiveRecord::Migration[8.1]
  def change
    create_table :rooms do |t|
      t.references :property, null: false, foreign_key: true
      t.string :name, null: false
      t.string :room_type, null: false
      t.integer :area_sqft

      t.timestamps
    end

    add_index :rooms, %i[property_id room_type]
  end
end
