Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :auth do
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"
    end

    resources :properties, only: %i[index show create update destroy]
    resources :search_histories, only: %i[index]

    resource :watchlist, only: %i[show], controller: "watchlist" do
      post "items", to: "watchlist_items#create"
      delete "items/:property_id", to: "watchlist_items#destroy"
    end
  end
end
