import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

const PrivacyPolicy: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
          Privacy Policy
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            1. Introduction
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to Git Mastery ("we," "our," or "us"). This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our educational platform for learning 
            Git and version control systems. Please read this privacy policy carefully. If you do not agree 
            with the terms of this privacy policy, please do not access the site.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            2. Information We Collect
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            Personal Information
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Account Information" 
                secondary="Name, email address, username, and password when you create an account"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Profile Information" 
                secondary="Additional information you choose to provide in your profile"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Educational Records" 
                secondary="Your progress, quiz scores, completed modules, and learning achievements"
              />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
            Usage Information
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Learning Activity" 
                secondary="Time spent on modules, interaction with exercises, and learning patterns"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Technical Information" 
                secondary="IP address, browser type, device information, and access logs"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            3. How We Use Your Information
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Provide and maintain our educational services" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Track your learning progress and provide personalized recommendations" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Communicate with you about your account and our services" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Improve our platform and develop new features" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Ensure the security and integrity of our platform" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Comply with legal obligations" />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            4. Information Sharing and Disclosure
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell, trade, or otherwise transfer your personal information to third parties without 
            your consent, except in the following circumstances:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Educational Institutions" 
                secondary="If you're enrolled through a school or institution, we may share progress data with your instructors"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Service Providers" 
                secondary="Third-party services that help us operate our platform (hosting, analytics, etc.)"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Legal Requirements" 
                secondary="When required by law or to protect our rights and safety"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            5. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement appropriate technical and organizational security measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction. However, no method 
            of transmission over the internet or electronic storage is 100% secure.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            6. Your Rights and Choices
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Access and Update" 
                secondary="You can access and update your account information at any time"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Data Portability" 
                secondary="You can request a copy of your personal data in a structured format"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Account Deletion" 
                secondary="You can request deletion of your account and associated data"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Communication Preferences" 
                secondary="You can opt out of non-essential communications"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            7. Cookies and Tracking Technologies
          </Typography>
          <Typography variant="body1" paragraph>
            We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, 
            and provide personalized content. You can control cookie settings through your browser preferences.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            8. Children's Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            Our service is not intended for children under 13. We do not knowingly collect personal information 
            from children under 13. If you are a parent or guardian and believe your child has provided us with 
            personal information, please contact us.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            9. Changes to This Privacy Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
            the new Privacy Policy on this page and updating the "Last updated" date.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            10. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about this Privacy Policy, please contact us at:
          </Typography>
          <Typography variant="body1">
            Email: privacy@gitmastery.com<br />
            Address: [Your Institution Address]
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy; 