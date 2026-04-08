class Room < ApplicationRecord
  belongs_to :property

  validates :name, :room_type, presence: true
end
