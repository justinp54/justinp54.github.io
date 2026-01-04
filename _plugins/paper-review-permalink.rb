module Jekyll
  # reviews collection의 permalink 자동 설정
  class ReviewsPermalinkGenerator < Generator
    safe true
    priority :low

    def generate(site)
      # reviews collection 확인
      reviews_collection = site.collections['reviews']
      return unless reviews_collection
      
      reviews_collection.docs.each do |doc|
        # 이미 permalink가 설정되어 있으면 건너뛰기
        next if doc.data['permalink']
        
        # 제목에서 slug 생성
        title = doc.data['title'] || doc.basename_without_ext
        slug = Jekyll::Utils.slugify(title, mode: 'default')
        
        # permalink 생성: /reviews/:slug/
        new_permalink = "/reviews/#{slug}/"
        
        # permalink 강제 설정
        doc.data['permalink'] = new_permalink
        
        Jekyll.logger.info "Reviews Permalink:", "Set permalink for #{doc.basename}: #{new_permalink}"
      end
    end
  end

  # Hook으로 URL 강제 설정 (더 일찍 실행)
  Hooks.register :reviews, :post_init do |review|
    next if review.data['permalink']
    
    # 제목에서 slug 생성
    title = review.data['title'] || review.basename_without_ext
    slug = Jekyll::Utils.slugify(title, mode: 'default')
    
    # permalink 생성: /reviews/:slug/
    new_permalink = "/reviews/#{slug}/"
    review.data['permalink'] = new_permalink
    Jekyll.logger.debug "Reviews Permalink Hook:", "Set permalink for #{review.basename}: #{new_permalink}"
  end
end

