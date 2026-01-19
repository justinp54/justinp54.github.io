module Jekyll
  class ReviewsTagPageGenerator < Generator
    safe true
    priority :low

    def generate(site)
      # reviews collection 확인
      reviews_collection = site.collections['reviews']
      unless reviews_collection
        Jekyll.logger.warn "Reviews Tag Pages:", "reviews collection not found"
        return
      end

      Jekyll.logger.info "Reviews Tag Pages:", "Generating tag and category pages for reviews collection"

      # 모든 태그 수집
      all_tags = {}
      reviews_collection.docs.each do |doc|
        next unless doc.data['tags']
        doc.data['tags'].each do |tag|
          tag_slug = Jekyll::Utils.slugify(tag, mode: 'default')
          all_tags[tag_slug] ||= { 'name' => tag, 'posts' => [] }
          all_tags[tag_slug]['posts'] << doc
        end
      end

      # 각 태그에 대한 페이지 생성
      all_tags.each do |tag_slug, tag_data|
        page = ReviewsTagPage.new(site, site.source, tag_slug, tag_data)
        site.pages << page
        Jekyll.logger.debug "Reviews Tag Pages:", "Created tag page: #{page.url}"
      end

      # 모든 카테고리 수집
      all_categories = {}
      reviews_collection.docs.each do |doc|
        next unless doc.data['categories']
        doc.data['categories'].each do |category|
          category_slug = Jekyll::Utils.slugify(category, mode: 'default')
          all_categories[category_slug] ||= { 'name' => category, 'posts' => [] }
          all_categories[category_slug]['posts'] << doc
        end
      end

      # 각 카테고리에 대한 페이지 생성
      all_categories.each do |category_slug, category_data|
        page = ReviewsCategoryPage.new(site, site.source, category_slug, category_data)
        site.pages << page
        Jekyll.logger.debug "Reviews Tag Pages:", "Created category page: #{page.url}"
      end

      # 연도 수집 및 페이지 생성 (/reviews/:year/)
      all_years = {}
      reviews_collection.docs.each do |doc|
        y = doc.date&.year
        next unless y
        all_years[y] ||= []
        all_years[y] << doc
      end

      all_years.keys.sort.each do |year|
        page = ReviewsYearPage.new(site, site.source, year, all_years[year])
        site.pages << page
        Jekyll.logger.debug "Reviews Tag Pages:", "Created year page: #{page.url}"
      end

      Jekyll.logger.info "Reviews Tag Pages:", "Generated #{all_tags.size} tag pages, #{all_categories.size} category pages, and #{all_years.size} year pages"
    end
  end

  class ReviewsTagPage < Page
    def initialize(site, base, tag_slug, tag_data)
      @site = site
      @base = base
      @dir = "reviews/tag/#{tag_slug}"
      @name = 'index.html'

      self.process(@name)
      
      # 기본 데이터 설정
      self.data = {}
      self.data['layout'] = 'archive'
      self.data['type'] = 'tags'
      self.data['title'] = tag_data['name']
      self.data['collection_name'] = 'reviews'
      self.data['documents'] = tag_data['posts'].sort_by { |doc| -doc.date.to_i }
      self.data['permalink'] = "/reviews/tag/#{tag_slug}/"
      self.content = ''
    end

    def url
      self.data['permalink'] || super
    end
  end

  class ReviewsCategoryPage < Page
    def initialize(site, base, category_slug, category_data)
      @site = site
      @base = base
      @dir = "reviews/category/#{category_slug}"
      @name = 'index.html'

      self.process(@name)
      
      # 기본 데이터 설정
      self.data = {}
      self.data['layout'] = 'archive'
      self.data['type'] = 'categories'
      self.data['title'] = category_data['name']
      self.data['collection_name'] = 'reviews'
      self.data['documents'] = category_data['posts'].sort_by { |doc| -doc.date.to_i }
      self.data['permalink'] = "/reviews/category/#{category_slug}/"
      self.content = ''
    end

    def url
      self.data['permalink'] || super
    end
  end

  class ReviewsYearPage < Page
    def initialize(site, base, year, docs)
      @site = site
      @base = base
      @dir = "reviews/#{year}"
      @name = 'index.html'

      self.process(@name)

      self.data = {}
      self.data['layout'] = 'archive'
      self.data['type'] = 'year'
      self.data['date'] = Time.utc(year, 1, 1)
      self.data['collection_name'] = 'reviews'
      self.data['documents'] = docs.sort_by { |doc| -doc.date.to_i }
      self.data['permalink'] = "/reviews/#{year}/"
      self.content = ''
    end

    def url
      self.data['permalink'] || super
    end
  end
end

