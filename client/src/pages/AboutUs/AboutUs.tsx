import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Avatar,
  Paper,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Link
} from '@mui/material';
import {
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Facebook as FacebookIcon,
  Email as EmailIcon
} from '@mui/icons-material';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  social: {
    linkedin?: string;
    github?: string;
    facebook?: string;
    email?: string;
  }
}

const AboutUs: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: "Dor Harush",
      role: "SCE student",
      image: "/images/team/dor-harush.jpg",
      bio: "Full stack developer with expertise in React and Node.js, leading the Git Mastery project development.",
      social: {
        github: "https://github.com/dor404",
        email: "dorha5@ac.sce.ac.il"
      }
    },
    {
      name: "Shoam Ben David",
      role: "SCE student",
      image: "/images/team/shoam-ben-david.jpg",
      bio: "Backend developer focused on creating robust and scalable server-side solutions.",
      social: {
        github: "https://github.com/ShoamBenDavid",
        email: "shoambe@ac.sce.ac.il"
      }
    },
    {
      name: "Itay Rozilyo",
      role: "SCE student",
      image: "/images/team/itay-rozilyo.jpg",
      bio: "Frontend specialist with a passion for creating intuitive and responsive user interfaces.",
      social: {
        github: "https://github.com/itayrozilyo",
        email: "itayro@ac.sce.ac.il"
      }
    },
    {
      name: "Asif Perets",
      role: "SCE student",
      image: "/images/team/asif-perets.jpg",
      bio: "Full stack developer with expertise in modern web technologies and user experience design.",
      social: {
        github: "https://github.com/asifpe13",
        email: "asifpe@ac.sce.ac.il"
      }
    },
    {
      name: "Ilay Golan",
      role: "UI/UX Designer",
      image: "/images/team/ilay-golan.jpg",
      bio: "Creative UI/UX designer with a keen eye for aesthetics and user experience, responsible for the interface design of Git Mastery.",
      social: {
        email: "ilaygo@ac.sce.ac.il"
      }
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* About Us Text Section */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          About Git Mastery
        </Typography>
        <Divider sx={{ mb: 4 }} />
        <Typography variant="h6" paragraph sx={{ maxWidth: '800px', mx: 'auto', mb: 3 }}>
          At Git Mastery, we're dedicated to making version control accessible to everyone.
        </Typography>
        <Typography paragraph sx={{ maxWidth: '800px', mx: 'auto' }}>
          Our mission is to provide the most comprehensive Git learning platform, designed
          for both beginners and experienced developers. We believe that mastering Git is
          essential for modern software development, and we're here to make that journey
          as smooth as possible.
        </Typography>
        <Typography paragraph sx={{ maxWidth: '800px', mx: 'auto' }}>
          We are a group of 5 developers working on a project in SCE college, dedicated to creating an educational platform for Git and Github.
        </Typography>
      </Box>
      
      {/* Team Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          Meet Our Team
        </Typography>
        <Grid container spacing={4}>
          {teamMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    src={member.image}
                    alt={member.name}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mb: 2,
                      border: '4px solid',
                      borderColor: 'primary.light'
                    }}
                  />
                  <Typography variant="h6" component="h3" align="center">
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom align="center">
                    {member.role}
                  </Typography>
                </Box>
                <CardContent sx={{ flexGrow: 1, px: 3 }}>
                  <Typography variant="body2" paragraph>
                    {member.bio}
                  </Typography>
                </CardContent>
                <CardActions sx={{ display: 'flex', justifyContent: 'center', pb: 2 }}>
                  {member.social.linkedin && (
                    <IconButton 
                      aria-label="linkedin" 
                      component={Link} 
                      href={member.social.linkedin} 
                      target="_blank"
                      color="primary"
                    >
                      <LinkedInIcon />
                    </IconButton>
                  )}
                  {member.social.github && (
                    <IconButton 
                      aria-label="github" 
                      component={Link} 
                      href={member.social.github} 
                      target="_blank"
                      color="primary"
                    >
                      <GitHubIcon />
                    </IconButton>
                  )}
                  {member.social.facebook && (
                    <IconButton 
                      aria-label="facebook" 
                      component={Link} 
                      href={member.social.facebook} 
                      target="_blank"
                      color="primary"
                    >
                      <FacebookIcon />
                    </IconButton>
                  )}
                  {member.social.email && (
                    <IconButton 
                      aria-label="email" 
                      component={Link} 
                      href={`mailto:${member.social.email}`} 
                      color="primary"
                    >
                      <EmailIcon />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Our Technology Stack Section */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Our Technology Stack
        </Typography>
        <Divider sx={{ mb: 4 }} />
        <Typography variant="h6" paragraph sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
          Git Mastery is built on the powerful MERN stack
        </Typography>
        
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom color="primary.main">
                MongoDB
              </Typography>
              <Box sx={{ mb: 2, width: '80px', height: '80px' }}>
                <img src="/images/tech/mongodb.webp" alt="MongoDB" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Typography variant="body2">
                A NoSQL database that provides high performance, high availability, and easy scalability for our application data.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom color="primary.main">
                Express.js
              </Typography>
              <Box sx={{ mb: 2, width: '80px', height: '80px' }}>
                <img src="/images/tech/express.png" alt="Express.js" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Typography variant="body2">
                A minimal and flexible Node.js web application framework that provides robust features for web and mobile applications.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom color="primary.main">
                React
              </Typography>
              <Box sx={{ mb: 2, width: '80px', height: '80px' }}>
                <img src="/images/tech/react.png" alt="React" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Typography variant="body2">
                A JavaScript library for building user interfaces with a component-based architecture for creating reusable UI components.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom color="primary.main">
                Node.js
              </Typography>
              <Box sx={{ mb: 2, width: '80px', height: '80px' }}>
                <img src="/images/tech/nodejs.png" alt="Node.js" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Typography variant="body2">
                A JavaScript runtime built on Chrome's V8 JavaScript engine, used for building fast and scalable server-side applications.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Our Values Section */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Our Values
        </Typography>
        <Divider sx={{ mb: 4 }} />
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Education First
              </Typography>
              <Typography variant="body1">
                We believe in providing clear, concise, and practical education
                that empowers developers at all stages of their career.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Continuous Improvement
              </Typography>
              <Typography variant="body1">
                Just like the version control system we teach, we're constantly
                iterating and improving our platform based on user feedback.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Community Driven
              </Typography>
              <Typography variant="body1">
                We're building a community of Git enthusiasts who learn from each
                other and contribute to the collective knowledge.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AboutUs; 