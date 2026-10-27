import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:tomato_care/admin_manage_alerts.dart';
import 'package:tomato_care/admin_update_profile.dart';
import 'admin_users_show_page.dart';
import 'faq_management_page.dart'; // Import FAQManagementPage
import 'login_screen.dart'; // Import the login screen
import 'ManageTreatmentPage.dart'; // Import ManageTreatmentPage
// Import AdminManageAlertsPage

class AdminDashboard extends StatefulWidget {
  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard>
    with WidgetsBindingObserver {
  bool isAuthenticated = false;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Check real authentication status and admin role
    checkAuthenticationStatus();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Check authentication status and verify user has admin role
  void checkAuthenticationStatus() async {
    User? currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) {
      _denyAccess('Access Denied: Please log in as an administrator.');
      return;
    }

    try {
      DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(currentUser.uid)
          .get();

      if (userDoc.exists) {
        final userData = userDoc.data() as Map<String, dynamic>?;
        if (userData != null && userData['role'] == 'admin') {
          if (mounted) {
            setState(() {
              isAuthenticated = true;
              isLoading = false;
            });
          }
          return;
        }
      }
      _denyAccess('Access Denied: Only administrators can view this page.');
    } catch (e) {
      print('Error verifying admin authorization: $e');
      _denyAccess('Authorization error. Access restricted to administrators.');
    }
  }

  void _denyAccess(String message) {
    if (!mounted) return;
    setState(() {
      isAuthenticated = false;
      isLoading = false;
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 4),
          ),
        );
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => LoginScreen()),
        );
      }
    });
  }

  // Handle app lifecycle changes
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      // If the app is paused (minimized), log out the user
      logout();
    }
  }

  // Method to handle logout
  void logout() {
    FirebaseAuth.instance.signOut();
    // Navigate back to the login screen
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          title: Center(
            child: Text(
              'Verifying Admin Access...',
              style: TextStyle(color: Colors.red, fontSize: 16),
            ),
          ),
        ),
        body: Center(
          child: CircularProgressIndicator(color: Colors.red),
        ),
      );
    }

    if (!isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.red,
          title: Text('Access Denied'),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.lock, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text(
                'Administrator Privileges Required',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text('You do not have permission to view sensitive administrative data.'),
            ],
          ),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Center(
          child: Image.asset(
            'assets/logo.jpg',
            height: 60,
            width: 60,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dashboard',
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 20),
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 20,
                crossAxisSpacing: 20,
                children: [
                  DashboardItem(
                    icon: Icons.people,
                    title: 'Users',
                    color: Colors.blue,
                    onTap: isAuthenticated
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => AdminUsersShowPage(),
                              ),
                            );
                          }
                        : null,
                  ),
                  DashboardItem(
                    icon: Icons.person,
                    title: 'Update Profile',
                    color: Colors.green,
                    onTap: isAuthenticated
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => AdminUpdateProfile(),
                              ),
                            );
                          }
                        : null,
                  ),
                  DashboardItem(
                    icon: Icons.notifications,
                    title: 'Manage Treatment',
                    color: Colors.orange,
                    onTap: isAuthenticated
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ManageTreatmentPage(),
                              ),
                            );
                          }
                        : null,
                  ),
                  DashboardItem(
                    icon: Icons.question_answer,
                    title: 'Manage FAQs',
                    color: Colors.purple,
                    onTap: isAuthenticated
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => FAQManagementPage(),
                              ),
                            );
                          }
                        : null,
                  ),
                  DashboardItem(
                    icon: Icons.notifications_active,
                    title: 'Manage Alerts',
                    color: Colors.red,
                    onTap: isAuthenticated
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => AdminManageAlertsPage(),
                              ),
                            );
                          }
                        : null,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Padding(
        padding: EdgeInsets.all(16.0),
        child: Material(
          // Wrap ElevatedButton in Material to apply InkWell effects
          color: Colors.transparent,
          child: InkWell(
            splashColor: Colors.red, // Set splashColor for "run" color effect
            borderRadius: BorderRadius.circular(8),
            onTap: isAuthenticated ? logout : null,
            child: Ink(
              height: 48,
              decoration: BoxDecoration(
                color: isAuthenticated
                    ? const Color.fromARGB(255, 243, 33, 33)
                    : Colors
                        .grey, // Change button color based on authentication status
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.exit_to_app,
                      color: Colors.white,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Logout',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class DashboardItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback? onTap;

  const DashboardItem({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: onTap != null
              ? color.withOpacity(0.8)
              : Colors.grey.withOpacity(0.5),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 60,
              color: Colors.white,
            ),
            SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
