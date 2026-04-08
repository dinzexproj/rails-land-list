class User < ApplicationRecord
  has_secure_password

  has_many :properties, dependent: :destroy
  has_many :watchlist_items, dependent: :destroy
  has_many :watched_properties, through: :watchlist_items, source: :property
  has_many :search_histories, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  before_validation :normalize_email

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end
end
