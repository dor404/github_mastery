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

const TermsOfService: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
          Terms of Service
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing and using Git Mastery ("the Service"), you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph>
            Git Mastery is an educational platform designed to teach Git version control and related software 
            development practices. The service includes interactive tutorials, exercises, quizzes, progress tracking, 
            and educational content related to version control systems.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            3. User Accounts and Registration
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Account Creation" 
                secondary="You must create an account to access most features of the service"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Accurate Information" 
                secondary="You agree to provide accurate, current, and complete information during registration"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Account Security" 
                secondary="You are responsible for maintaining the confidentiality of your account credentials"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Account Responsibility" 
                secondary="You are responsible for all activities that occur under your account"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            4. Acceptable Use Policy
          </Typography>
          <Typography variant="body1" paragraph>
            You agree to use the service only for lawful purposes and in accordance with these Terms. You agree NOT to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Use the service for any unlawful purpose or to solicit unlawful activity" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Attempt to gain unauthorized access to any part of the service" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Interfere with or disrupt the service or servers connected to the service" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Share your account credentials with others" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Upload or distribute viruses, malware, or other malicious code" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Violate any applicable laws or regulations" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Harass, abuse, or harm other users" />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            5. Educational Use and Academic Integrity
          </Typography>
          <Typography variant="body1" paragraph>
            This platform is designed for educational purposes. Users are expected to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Engage honestly with learning materials and assessments" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Not share quiz answers or solutions with other students" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Respect intellectual property rights of educational content" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Follow their institution's academic integrity policies" />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            6. Intellectual Property Rights
          </Typography>
          <Typography variant="body1" paragraph>
            The service and its original content, features, and functionality are owned by Git Mastery and are 
            protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Educational Content" 
                secondary="All educational materials, tutorials, and exercises are proprietary to Git Mastery"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="User-Generated Content" 
                secondary="You retain ownership of content you create, but grant us a license to use it for educational purposes"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Fair Use" 
                secondary="Content is provided for educational purposes under fair use principles"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            7. Privacy and Data Protection
          </Typography>
          <Typography variant="body1" paragraph>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of 
            the service, to understand our practices regarding the collection and use of your personal information.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            8. Service Availability and Modifications
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Service Availability" 
                secondary="We strive to maintain service availability but cannot guarantee uninterrupted access"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Maintenance" 
                secondary="The service may be temporarily unavailable for maintenance or updates"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Modifications" 
                secondary="We reserve the right to modify or discontinue the service with reasonable notice"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            9. Disclaimer of Warranties
          </Typography>
          <Typography variant="body1" paragraph>
            The service is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, 
            regarding the service, including but not limited to warranties of merchantability, fitness for a particular 
            purpose, or non-infringement.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            10. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            In no event shall Git Mastery, its directors, employees, or agents be liable for any indirect, incidental, 
            special, consequential, or punitive damages, including without limitation, loss of profits, data, use, 
            or goodwill, arising out of your use of the service.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            11. Termination
          </Typography>
          <Typography variant="body1" paragraph>
            We may terminate or suspend your account and access to the service immediately, without prior notice, 
            for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            12. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These Terms shall be interpreted and governed by the laws of the jurisdiction where the educational 
            institution is located, without regard to its conflict of law provisions.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            13. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to modify these terms at any time. We will notify users of any material changes 
            via email or through the service. Your continued use of the service after such modifications constitutes 
            acceptance of the updated terms.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            14. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about these Terms of Service, please contact us at:
          </Typography>
          <Typography variant="body1">
            Email: support@gitmastery.com<br />
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfService; 