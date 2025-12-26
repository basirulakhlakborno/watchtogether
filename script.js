// Typing Effect - Only run if element exists
const typingText = document.getElementById('typing-text');
if (typingText) {
    const texts = [
        'Full Stack Developer',
        'Code Architect',
        'Digital Craftsman',
        'Problem Solver'
    ];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeText() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typingText.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingText.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeSpeed = 500;
        }

        setTimeout(typeText, typeSpeed);
    }

    // Start typing effect when page loads
    window.addEventListener('load', () => {
        setTimeout(typeText, 1000);
    });
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
}

// Navbar Background on Scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
    
    lastScroll = currentScroll;
});

// Animate Stats on Scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const animateCounter = (element, target) => {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            const target = parseInt(statNumber.getAttribute('data-target'));
            animateCounter(statNumber, target);
            statsObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.stat-item').forEach(stat => {
    statsObserver.observe(stat);
});

// Animate Elements on Scroll
const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// Apply fade-in animation to cards
document.querySelectorAll('.skill-card, .project-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeInObserver.observe(card);
});

// Smooth hover effect for buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
    });
});

// Parallax Effect for Hero Section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        hero.style.opacity = 1 - (scrolled / 500);
    }
});

// Title stays clean and professional - no glitch effects

// Terminal cursor blink
const cursor = document.querySelector('.cursor');
if (cursor) {
    setInterval(() => {
        cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
    }, 500);
}

// Add hover effect to project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.borderColor = 'var(--primary-black)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.borderColor = 'var(--border-color)';
    });
});

// Add active state to navigation links
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Performance optimization: Throttle scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply throttling to scroll events
const throttledScroll = throttle(() => {
    // Scroll-based animations here
}, 16);

window.addEventListener('scroll', throttledScroll);

// GitHub Profile API Integration
async function loadGitHubProfile() {
    const username = 'basirulakhlakborno';
    const apiUrl = `https://api.github.com/users/${username}`;
    
    const loadingElement = document.getElementById('githubLoading');
    const profileElement = document.getElementById('githubProfileHeader');
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch GitHub profile');
        }
        
        const data = await response.json();
        
        // Update avatar
        const avatar = document.getElementById('githubAvatar');
        if (avatar) {
            avatar.src = data.avatar_url || `https://github.com/identicons/${username}.png`;
            avatar.alt = data.name || username;
        }
        
        // Update name
        const nameElement = document.getElementById('githubName');
        if (nameElement) {
            nameElement.textContent = data.name || username;
        }
        
        // Update username
        const usernameElement = document.getElementById('githubUsername');
        if (usernameElement) {
            usernameElement.textContent = `@${data.login}`;
        }
        
        // Update bio
        const bioElement = document.getElementById('githubBio');
        if (bioElement) {
            if (data.bio) {
                bioElement.textContent = `"${data.bio}"`;
                bioElement.style.display = 'block';
            } else {
                bioElement.style.display = 'none';
            }
        }
        
        // Update stats
        const reposElement = document.getElementById('githubRepos');
        if (reposElement) {
            reposElement.textContent = data.public_repos || 0;
        }
        
        const followersElement = document.getElementById('githubFollowers');
        if (followersElement) {
            followersElement.textContent = data.followers || 0;
        }
        
        const followingElement = document.getElementById('githubFollowing');
        if (followingElement) {
            followingElement.textContent = data.following || 0;
        }
        
        // Update location
        const locationElement = document.getElementById('githubLocation');
        const locationText = document.getElementById('githubLocationText');
        if (locationElement && locationText) {
            if (data.location) {
                locationText.textContent = data.location;
                locationElement.style.display = 'flex';
            } else {
                locationElement.style.display = 'none';
            }
        }
        
        // Update blog/website
        const blogElement = document.getElementById('githubBlog');
        const blogLink = document.getElementById('githubBlogLink');
        const blogText = document.getElementById('githubBlogText');
        if (blogElement && blogLink && blogText) {
            if (data.blog) {
                const blogUrl = data.blog.startsWith('http') ? data.blog : `https://${data.blog}`;
                blogLink.href = blogUrl;
                blogText.textContent = data.blog;
                blogElement.style.display = 'block';
            } else {
                blogElement.style.display = 'none';
            }
        }
        
        // Update profile link
        const profileLink = document.getElementById('githubProfileLink');
        if (profileLink) {
            profileLink.href = data.html_url || `https://github.com/${username}`;
        }
        
        // Update social media links from GitHub
        updateSocialLinks(data, username);
        
        // Hide loading, show profile
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        if (profileElement) {
            profileElement.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error loading GitHub profile:', error);
        if (loadingElement) {
            loadingElement.innerHTML = '<p style="color: var(--text-gray);">Unable to load GitHub profile</p>';
        }
    }
}

// Function to fetch social links from GitHub profile page
async function fetchSocialLinksFromGitHub(username) {
    try {
        // Try to fetch the profile README.md which often contains social links
        const readmeUrl = `https://api.github.com/repos/${username}/${username}/contents/README.md`;
        const readmeResponse = await fetch(readmeUrl);
        
        if (readmeResponse.ok) {
            const readmeData = await readmeResponse.json();
            if (readmeData.content) {
                const readmeContent = atob(readmeData.content);
                return parseSocialLinksFromText(readmeContent);
            }
        }
    } catch (error) {
        console.log('Could not fetch README, trying alternative methods...');
    }
    
    // Alternative: Try to fetch from profile repository
    try {
        const profileRepoUrl = `https://api.github.com/repos/${username}/${username}.github.io/contents/README.md`;
        const profileResponse = await fetch(profileRepoUrl);
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.content) {
                const profileContent = atob(profileData.content);
                return parseSocialLinksFromText(profileContent);
            }
        }
    } catch (error) {
        console.log('Could not fetch profile repo README...');
    }
    
    return null;
}

// Function to parse social links from text content
function parseSocialLinksFromText(text) {
    const socialLinks = {
        facebook: null,
        instagram: null,
        linkedin: null,
        twitter: null,
        email: null
    };
    
    // Facebook patterns
    const facebookPatterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/([a-zA-Z0-9.]+)/gi,
        /facebook[:\s]+(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/([a-zA-Z0-9.]+)/gi
    ];
    
    for (const pattern of facebookPatterns) {
        const match = text.match(pattern);
        if (match) {
            const username = match[0].replace(/https?:\/\/(www\.)?(facebook\.com|fb\.com)\//i, '').trim();
            socialLinks.facebook = `https://facebook.com/${username}`;
            break;
        }
    }
    
    // Instagram patterns
    const instagramPatterns = [
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/gi,
        /instagram[:\s]+(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/gi,
        /@([a-zA-Z0-9_.]+)\s*\(instagram\)/gi
    ];
    
    for (const pattern of instagramPatterns) {
        const match = text.match(pattern);
        if (match) {
            const username = match[0].replace(/https?:\/\/(www\.)?instagram\.com\//i, '').replace('@', '').trim();
            socialLinks.instagram = `https://instagram.com/${username}`;
            break;
        }
    }
    
    // LinkedIn patterns
    const linkedinPatterns = [
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi,
        /linkedin[:\s]+(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi
    ];
    
    for (const pattern of linkedinPatterns) {
        const match = text.match(pattern);
        if (match) {
            const username = match[0].replace(/https?:\/\/(www\.)?linkedin\.com\/in\//i, '').trim();
            socialLinks.linkedin = `https://linkedin.com/in/${username}`;
            break;
        }
    }
    
    // Twitter patterns
    const twitterPatterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi,
        /twitter[:\s]+(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi
    ];
    
    for (const pattern of twitterPatterns) {
        const match = text.match(pattern);
        if (match) {
            const username = match[0].replace(/https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, '').trim();
            socialLinks.twitter = `https://twitter.com/${username}`;
            break;
        }
    }
    
    // Email patterns
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
        socialLinks.email = `mailto:${emailMatch[0]}`;
    }
    
    return socialLinks;
}

// Function to update social media links from GitHub data
async function updateSocialLinks(githubData, username) {
    // Update GitHub link (always available)
    const githubLinks = document.querySelectorAll('a[href*="github.com"]');
    githubLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('github.com') && !href.includes(username)) {
            link.href = githubData.html_url || `https://github.com/${username}`;
        }
    });
    
    // Try to fetch social links from GitHub profile/README
    const socialLinks = await fetchSocialLinksFromGitHub(username);
    
    if (socialLinks) {
        // Update Facebook
        if (socialLinks.facebook) {
            const facebookLink = document.querySelector('a[title="Facebook"]');
            if (facebookLink) {
                facebookLink.href = socialLinks.facebook;
            }
        }
        
        // Update Instagram
        if (socialLinks.instagram) {
            const instagramLink = document.querySelector('a[title="Instagram"]');
            if (instagramLink) {
                instagramLink.href = socialLinks.instagram;
            }
        }
        
        // Update LinkedIn
        if (socialLinks.linkedin) {
            const linkedinLink = document.querySelector('a[title="LinkedIn"]');
            if (linkedinLink) {
                linkedinLink.href = socialLinks.linkedin;
            }
        }
        
        // Update Twitter
        if (socialLinks.twitter) {
            const twitterLink = document.querySelector('a[title="Twitter"]');
            if (twitterLink) {
                twitterLink.href = socialLinks.twitter;
            }
        }
        
        // Update Email
        if (socialLinks.email) {
            const emailLinks = document.querySelectorAll('a[title="Email"], a[href^="mailto:"]');
            emailLinks.forEach(emailLink => {
                emailLink.href = socialLinks.email;
            });
        }
    }
    
    // Fallback: Parse bio for social media links
    if (githubData.bio) {
        const bioLinks = parseSocialLinksFromText(githubData.bio);
        
        // Update Facebook from bio if not found in README
        if (!socialLinks?.facebook && bioLinks.facebook) {
            const facebookLink = document.querySelector('a[title="Facebook"]');
            if (facebookLink) {
                facebookLink.href = bioLinks.facebook;
            }
        }
        
        // Update Instagram from bio if not found in README
        if (!socialLinks?.instagram && bioLinks.instagram) {
            const instagramLink = document.querySelector('a[title="Instagram"]');
            if (instagramLink) {
                instagramLink.href = bioLinks.instagram;
            }
        }
    }
    
    // Update Twitter if available from GitHub API
    if (githubData.twitter_username) {
        const twitterLink = document.querySelector('a[title="Twitter"]');
        if (twitterLink) {
            twitterLink.href = `https://twitter.com/${githubData.twitter_username}`;
        }
    }
    
    // Update blog/website if it's a social media platform
    if (githubData.blog) {
        const blogUrl = githubData.blog.startsWith('http') ? githubData.blog : `https://${githubData.blog}`;
        
        if (blogUrl.includes('facebook.com') || blogUrl.includes('fb.com')) {
            const facebookLink = document.querySelector('a[title="Facebook"]');
            if (facebookLink && !socialLinks?.facebook) {
                facebookLink.href = blogUrl;
            }
        } else if (blogUrl.includes('instagram.com')) {
            const instagramLink = document.querySelector('a[title="Instagram"]');
            if (instagramLink && !socialLinks?.instagram) {
                instagramLink.href = blogUrl;
            }
        } else if (blogUrl.includes('linkedin.com')) {
            const linkedinLink = document.querySelector('a[title="LinkedIn"]');
            if (linkedinLink && !socialLinks?.linkedin) {
                linkedinLink.href = blogUrl;
            }
        }
    }
}

// Load GitHub profile when page loads
window.addEventListener('load', () => {
    loadGitHubProfile();
    
    // Refresh profile every 5 minutes (optional)
    setInterval(loadGitHubProfile, 300000);
});

// Add pulse animation for loading
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(style);

