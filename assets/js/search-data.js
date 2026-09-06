// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-paper-reviews",
          title: "Paper Reviews",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/reviews/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-awarded-the-kwanjeong-scholarship-from-the-kwanjeong-foundation",
          title: 'Awarded the Kwanjeong Scholarship from the Kwanjeong Foundation.',
          description: "",
          section: "News",},{id: "news-selected-for-snu-tomorrow-s-engineers-membership-stem-college-of-engineering",
          title: 'Selected for SNU Tomorrow’s Engineers Membership (STEM), College of Engineering.',
          description: "",
          section: "News",},{id: "news-started-undergraduate-research-through-the-urop-program-at-snu-biomedical-amp-amp-health-informatics-lab-advised-by-prof-sun-kim",
          title: 'Started undergraduate research through the UROP program at SNU Biomedical &amp;amp;amp; Health Informatics...',
          description: "",
          section: "News",},{id: "news-joined-snu-computational-biology-lab-as-a-research-intern-advised-by-prof-chaok-seok",
          title: 'Joined SNU Computational Biology Lab as a Research Intern, advised by Prof. Chaok...',
          description: "",
          section: "News",},{id: "projects-project-1",
          title: 'project 1',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-project-2",
          title: 'project 2',
          description: "a project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-project-3-with-very-long-name",
          title: 'project 3 with very long name',
          description: "a project that redirects to another website",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{id: "projects-project-4",
          title: 'project 4',
          description: "another without an image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/4_project/";
            },},{id: "projects-project-5",
          title: 'project 5',
          description: "a project with a background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/5_project/";
            },},{id: "projects-project-6",
          title: 'project 6',
          description: "a project with no image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/6_project/";
            },},{id: "projects-project-7",
          title: 'project 7',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/7_project/";
            },},{id: "projects-project-8",
          title: 'project 8',
          description: "an other project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/8_project/";
            },},{id: "projects-project-9",
          title: 'project 9',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/projects/9_project/";
            },},{id: "reviews-논문리뷰-denoising-diffusion-probabilistic-models-ddpm",
          title: '[논문리뷰] Denoising Diffusion Probabilistic Models (DDPM)',
          description: "Diffusion model의 시작점. Forward/reverse process, training objective 유도까지 정리.",
          section: "Reviews",handler: () => {
              window.location.href = "/reviews/denoising-diffusion-probabilistic-models-ddpm/";
            },},{id: "reviews-논문리뷰-chemberta-large-scale-self-supervised-pretraining-for-molecular-property-prediction",
          title: '[논문리뷰] ChemBERTa: Large-Scale Self-Supervised Pretraining for Molecular Property Prediction',
          description: "ChemBERTa; molecular property prediction을 위한 scalable한 self-supervised pretraining 방법론 제안",
          section: "Reviews",handler: () => {
              window.location.href = "/reviews/chemberta/";
            },},{id: "reviews-논문리뷰-unimol-a-universal-3d-molecular-representation-learning-framework",
          title: '[논문리뷰] UniMol: A Universal 3D Molecular Representation Learning Framework',
          description: "3D 분자 representation learning을 위한 프레임워크, UniMol",
          section: "Reviews",handler: () => {
              window.location.href = "/reviews/unimol/";
            },},{id: "reviews-논문리뷰-galaxydock-dl-protein-ligand-docking-by-global-optimization-and-neural-network-energy",
          title: '[논문리뷰] GalaxyDock-DL: Protein-Ligand Docking by Global Optimization and Neural Network Energy',
          description: "Global optimization과 neural network 기반 energy를 결합한 protein-ligand docking 방법론, GalaxyDock-DL",
          section: "Reviews",handler: () => {
              window.location.href = "/reviews/galaxydockdl/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%6A%75%73%74%69%6E%70%35%34@%73%6E%75.%61%63.%6B%72", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/justinp54", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/junsang-park", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=qc6CJjYAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
