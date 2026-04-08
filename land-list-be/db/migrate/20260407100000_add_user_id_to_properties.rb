class AddUserIdToProperties < ActiveRecord::Migration[8.1]
  def up
    add_reference :properties, :user, foreign_key: true, null: true

    execute <<~SQL.squish
      UPDATE properties
      SET user_id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
      WHERE user_id IS NULL
        AND EXISTS (SELECT 1 FROM users LIMIT 1)
    SQL

    nulls = select_value("SELECT COUNT(*) FROM properties WHERE user_id IS NULL").to_i
    if nulls.positive?
      raise ActiveRecord::IrreversibleMigration,
            "Properties exist but no user could be assigned. Create a user first or assign user_id manually."
    end

    change_column_null :properties, :user_id, false
  end

  def down
    remove_reference :properties, :user, foreign_key: true
  end
end
