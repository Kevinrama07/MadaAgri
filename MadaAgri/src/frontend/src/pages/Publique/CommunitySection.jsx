import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '../../styles/Publique/CommunitySection.module.css';

gsap.registerPlugin(ScrollTrigger);

const communityMembers = [
  {
    id: 1,
    name: 'Jean Rakoto',
    culture: 'Riz',
    region: 'Antananarivo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  },
  {
    id: 2,
    name: 'Marie Andria',
    culture: 'Tomates',
    region: 'Fianarantsoa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  },
  {
    id: 3,
    name: 'Paul Razafindrakoto',
    culture: 'Maïs',
    region: 'Toliary',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
  },
  {
    id: 4,
    name: 'Sophie Randrianasolo',
    culture: 'Vanille',
    region: 'SAVA',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  },
  {
    id: 5,
    name: 'Marc Ratsimba',
    culture: 'Cacao',
    region: 'Sambava',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  },
  {
    id: 6,
    name: 'Nadia Hasan',
    culture: 'Fruits',
    region: 'Antsiranana',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  },
];

export default function CommunitySection() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Animation titre
    gsap.fromTo('.community-title',
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

    // Animation des avatars
    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(card,
        { opacity: 0, scale: 0.8 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          delay: index * 0.1,
          force3D: true,
        }
      );
    });
  }, []);

  return (
    <section className={clsx(styles['community-section'])} ref={sectionRef}>
      <div className={clsx(styles['community-container'])}>
        <h2 className={clsx(styles['community-title'])}>Notre Communauté</h2>
        <p className={clsx(styles['community-subtitle'])}>Rejoignez des milliers d'agriculteurs actifs</p>

        <div className={clsx(styles['community-grid'])}>
          {communityMembers.map((member, index) => (
            <div
              key={member.id}
              className={clsx(styles['community-card'])}
              ref={(el) => (cardsRef.current[index] = el)}
            >
              <img src={member.avatar} alt={member.name} className={clsx(styles['community-avatar'])} />
              <h3 className={clsx(styles['community-member-name'])}>{member.name}</h3>
              <p className={clsx(styles['community-culture'])}>{member.culture}</p>
              <p className={clsx(styles['community-region'])}>{member.region}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
