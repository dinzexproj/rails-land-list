class Property < ApplicationRecord
  PROPERTY_TYPES = %w[HOUSE APARTMENT TOWNHOUSE LAND CONDO].freeze
  SELLING_STATUSES = %w[FOR_SALE PENDING SOLD OFF_MARKET].freeze

  belongs_to :user

  has_many :rooms, dependent: :destroy
  has_many :watchlist_items, dependent: :destroy
  has_many :watchers, through: :watchlist_items, source: :user

  validates :title, :property_type, :selling_status, :city, :state, presence: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }, presence: true
  validates :bedrooms, :bathrooms, numericality: { greater_than_or_equal_to: 0 }, presence: true
  validates :property_type, length: { maximum: 50 }, format: { with: /\A[A-Z_]+\z/ }
  validates :selling_status, inclusion: { in: SELLING_STATUSES }
  validates :lonlat, presence: true

  after_update_commit :broadcast_watchers_update, if: :broadcastable_change?

  # Stable generic image per listing (no uploads; derived from id).
  def listing_image_url
    "https://picsum.photos/seed/landlot-#{id}/800/500"
  end

  private

  def broadcastable_change?
    saved_change_to_price_cents? || saved_change_to_selling_status?
  end

  def broadcast_watchers_update
    watchers.find_each do |user|
      WatchedPropertiesChannel.broadcast_to(
        user,
        {
          type: "property_updated",
          property: {
            id: id,
            price_cents: price_cents,
            selling_status: selling_status,
            updated_at: updated_at
          }
        }
      )
    end
  end
end
