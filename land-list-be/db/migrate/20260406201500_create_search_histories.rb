class CreateSearchHistories < ActiveRecord::Migration[8.1]
  def change
    create_table :search_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.jsonb :query, null: false, default: {}

      t.timestamps
    end

    add_index :search_histories, :created_at
    add_index :search_histories, :query, using: :gin
  end
end
