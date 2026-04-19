import { useEffect, useRef } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/FeedPreview.css';

gsap.registerPlugin(ScrollTrigger);

const mockPosts = [
  {
    id: 1,
    author: 'Jean Rakoto',
    region: 'Antananarivo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800&auto=format&fit=crop',
    title: 'Récolte exceptionnelle de riz cette année!',
    likes: 324,
    comments: 52,
    timestamp: 'Il y a 2 jours',
  },
  {
    id: 2,
    author: 'Marie Andria',
    region: 'Fianarantsoa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop',
    image: 'https://www.jardiner-malin.fr/wp-content/uploads/2020/07/tomate.jpg',
    title: 'Culture de tomates sous serres - nouvelle technique',
    likes: 521,
    comments: 89,
    timestamp: 'Il y a 5 jours',
  },
  {
    id: 3,
    author: 'Paul Razafindrakoto',
    region: 'Toliary',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop',
    image: 'https://www.lespetitsplatsdarthur.com/wp-content/uploads/2021/04/Lagriculture-biologique-838x300.jpg',
    title: 'Élevage durable et agriculture biologique',
    likes: 412,
    comments: 71,
    timestamp: 'Il y a 1 semaine',
  },
];

export default function FeedPreview() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Animation titre section
    gsap.fromTo('.feed-section-title',
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        force3D: true,
      }
    );

    // Animation des cartes
    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(card,
        { opacity: 0, y: 40 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: index * 0.15,
          force3D: true,
        }
      );
    });
  }, []);

  return (
    <section className="feed-section" ref={sectionRef}>
      <div className="feed-container">
        <h2 className="feed-section-title">Aperçu du réseau</h2>
        <p className="feed-section-subtitle">Découvrez ce que partagent les agriculteurs</p>

        <div className="feed-grid">
          {mockPosts.map((post, index) => (
            <div
              key={post.id}
              className="feed-card"
              ref={(el) => (cardsRef.current[index] = el)}
            >
              {/* Header */}
              <div className="feed-card-header">
                <div className="feed-card-author">
                  <img src={post.avatar} alt={post.author} className="feed-avatar" />
                  <div className="feed-author-info">
                    <h3 className="feed-author-name">{post.author}</h3>
                    <p className="feed-author-region">{post.region}</p>
                  </div>
                </div>
                <div className="feed-more-btn">
                  <FiMoreVertical />
                </div>
              </div>

              {/* Image */}
              <div className="feed-card-image">
                <img src={post.image} alt={post.title} />
              </div>

              {/* Actions */}
              <div className="feed-card-actions">
                <button className="action-btn like-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <button className="action-btn comment-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
                <button className="action-btn share-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
              </div>

              {/* Stats */}
              <div className="feed-card-stats">
                <span className="stat">
                  <strong>{post.likes}</strong> J'aime
                </span>
                <span className="stat">
                  <strong>{post.comments}</strong> commentaires
                </span>
              </div>

              {/* Caption */}
              <div className="feed-card-caption">
                <p>
                  <strong>{post.author}</strong> {post.title}
                </p>
              </div>

              {/* Timestamp */}
              <div className="feed-card-timestamp">
                {post.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
