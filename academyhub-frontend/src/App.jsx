import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import CourseList from './pages/courses/CourseList';
import CourseDetail from './pages/courses/CourseDetail';
import CourseCreate from './pages/courses/CourseCreate';
import CourseEdit from './pages/courses/CourseEdit';
import MyCourses from './pages/courses/MyCourses';
import MyPayments from './pages/students/MyPayments';
import CategoryManagement from './pages/admin/CategoryManagement';
import AdminUserCreate from './pages/admin/AdminUserCreate';
import AdminProfile from './pages/admin/AdminProfile';
import AdminRefundList from './pages/admin/AdminRefundList';
import MailConfiguration from './pages/Admin/MailConfiguration';
import AdminReviews from './pages/admin/AdminReviews';  
import InstructorList from './pages/instructor/InstructorList';
import InstructorCreate from './pages/instructor/InstructorCreate';
import InstructorEdit from './pages/instructor/InstructorEdit';
import InstructorDetail from './pages/instructor/InstructorDetail';
import InstructorProfile from './pages/instructor/InstructorProfile'; 
import InstructorCourseList from './pages/instructor/InstructorCourseList';
import InstructorStudents from './pages/instructor/InstructorStudents';
import StudentList from './pages/students/StudentList';
import StudentCreate from './pages/students/StudentCreate';
import StudentEdit from './pages/students/StudentEdit';
import StudentDetail from './pages/students/StudentDetail';
import StudentProfile from './pages/students/StudentProfile';
import Layout from './components/Layout';
import LessonCreate from './pages/lessons/LessonCreate';
import LessonEdit from './pages/lessons/LessonEdit';
import LessonPlayer from './pages/lessons/LessonPlayer';
import Checkout from './pages/payments/Checkout'; 
import ExamList from './pages/exams/ExamList';
import ExamTake from './pages/exams/ExamTake';
import ExamResult from './pages/exams/ExamResult';
import CertificateList from './pages/certificates/CertificateList';
import CertificateDetail from './pages/certificates/CertificateDetail';
import CertificateVerify from './pages/certificates/CertificateVerify';

// YENİ IMPORT'LAR
import InstructorExamList from './pages/instructor/InstructorExamList';
import InstructorExamCreate from './pages/instructor/InstructorExamCreate';
import InstructorExamEdit from './pages/instructor/InstructorExamEdit';
import InstructorCertificateList from './pages/instructor/InstructorCertificateList';

import './App.css';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <div className="loading-screen">Yükleniyor...</div>;
    }
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    const isAdmin = user?.role === 'Admin' || user?.role === 3;
    
    if (isLoading) {
        return <div className="loading-screen">Yükleniyor...</div>;
    }
    
    if (!isAdmin) {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

// Admin ve Eğitmen için route
const InstructorAdminRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    const isAuthorized = user?.role === 'Admin' || user?.role === 'Instructor' || user?.role === 3 || user?.role === 2;
    
    if (isLoading) {
        return <div className="loading-screen">Yükleniyor...</div>;
    }
    
    if (!isAuthorized) {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* PUBLIC ROUTES - Layout ile sarılı */}
                    <Route path="/" element={<Navigate to="/courses" />} />
                    <Route path="/courses" element={<Layout><CourseList /></Layout>} />
                    <Route path="/courses/:id" element={<Layout><CourseDetail /></Layout>} />

                    {/* AUTH ROUTES - Layout'sız */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* PROTECTED ROUTES - Layout ile sarılı */}
                    <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
                    <Route path="/courses/create" element={<PrivateRoute><Layout><CourseCreate /></Layout></PrivateRoute>} />
                    <Route path="/courses/edit/:id" element={<PrivateRoute><Layout><CourseEdit /></Layout></PrivateRoute>} />
                    <Route path="/my-courses" element={<PrivateRoute><Layout><MyCourses /></Layout></PrivateRoute>} />

                    {/* ÖDEMELERİM ROUTE'U */}
                    <Route path="/payments" element={<PrivateRoute><Layout><MyPayments /></Layout></PrivateRoute>} />
                    
                    {/* CHECKOUT ROUTE - ÖDEME SAYFASI */}
                    <Route path="/checkout/:courseId" element={
                        <PrivateRoute>
                            <Layout><Checkout /></Layout>
                        </PrivateRoute>
                    } />

                    {/* EXAM ROUTES */}
                    <Route path="/courses/:courseId/exams" element={
                        <PrivateRoute>
                            <Layout><ExamList /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/exam/take/:examResultId" element={
                        <PrivateRoute>
                            <ExamTake />
                        </PrivateRoute>
                    } />
                    <Route path="/exam/result/:resultId" element={
                        <PrivateRoute>
                            <ExamResult />
                        </PrivateRoute>
                    } />
                    
                    {/* CERTIFICATE ROUTES */}
                    <Route path="/certificates" element={
                        <PrivateRoute>
                            <Layout><CertificateList /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/certificates/:id" element={
                        <PrivateRoute>
                            <Layout><CertificateDetail /></Layout>
                        </PrivateRoute>
                    } /> 
                    <Route path="/certificates/verify" element={<CertificateVerify />} />
                    
                    {/* ============ ADMIN ROUTES ============ */}
                    {/* KATEGORİ - Admin ve Eğitmen erişebilir */}
                    <Route path="/admin/categories" element={
                        <InstructorAdminRoute>
                            <CategoryManagement />                         
                        </InstructorAdminRoute>
                    } />
                    <Route path="/admin/users/create" element={<AdminRoute><Layout><AdminUserCreate /></Layout></AdminRoute>} />
                    <Route path="/admin/profile" element={<AdminRoute><Layout><AdminProfile /></Layout></AdminRoute>} />
                    <Route path="/admin/refunds" element={<AdminRoute><Layout><AdminRefundList /></Layout></AdminRoute>} />
                    <Route path="/instructors" element={<AdminRoute><Layout><InstructorList /></Layout></AdminRoute>} />
                    <Route path="/instructors/create" element={<AdminRoute><Layout><InstructorCreate /></Layout></AdminRoute>} />
                    <Route path="/instructors/edit/:id" element={<AdminRoute><Layout><InstructorEdit /></Layout></AdminRoute>} />
                    <Route path="/instructors/:id" element={<AdminRoute><Layout><InstructorDetail /></Layout></AdminRoute>} />
                    <Route path="/admin/mail-configuration" element={
                        <AdminRoute>
                            <Layout>
                                <MailConfiguration />
                            </Layout>
                        </AdminRoute>
                    } />
                    
                    {/*  YORUM ONAYLARI - SADECE ADMIN  */}
                    <Route path="/admin/reviews" element={
                        <AdminRoute>
                            <Layout>
                                <AdminReviews />
                            </Layout>
                        </AdminRoute>
                    } />
                    
                    {/* ============ INSTRUCTOR ROUTES ============ */}
                    <Route path="/instructor/profile" element={<PrivateRoute><Layout><InstructorProfile /></Layout></PrivateRoute>} />
                    <Route path="/instructor/courses" element={<PrivateRoute><Layout><InstructorCourseList /></Layout></PrivateRoute>} />
                    <Route path="/instructor/students" element={<PrivateRoute><Layout><InstructorStudents /></Layout></PrivateRoute>} />
                    
                    {/* YENİ EĞİTMEN ROUTE'LARI */}
                    <Route path="/instructor/exams" element={<PrivateRoute><Layout><InstructorExamList /></Layout></PrivateRoute>} />
                    <Route path="/instructor/exams/create" element={<PrivateRoute><Layout><InstructorExamCreate /></Layout></PrivateRoute>} />
                    <Route path="/instructor/exams/edit/:id" element={<PrivateRoute><Layout><InstructorExamEdit /></Layout></PrivateRoute>} />
                    <Route path="/instructor/certificates" element={<PrivateRoute><Layout><InstructorCertificateList /></Layout></PrivateRoute>} />
                    
                    {/* ============ STUDENT ROUTES ============ */}
                    <Route path="/students" element={<AdminRoute><Layout><StudentList /></Layout></AdminRoute>} />
                    <Route path="/students/create" element={<AdminRoute><Layout><StudentCreate /></Layout></AdminRoute>} />
                    <Route path="/students/edit/:id" element={<AdminRoute><Layout><StudentEdit /></Layout></AdminRoute>} />
                    <Route path="/students/:id" element={<AdminRoute><Layout><StudentDetail /></Layout></AdminRoute>} />
                    
                    {/* PROFILE */}
                    <Route path="/profile" element={<PrivateRoute><Layout><StudentProfile /></Layout></PrivateRoute>} />

                    {/* LESSON ROUTES */}
                    <Route path="/courses/:courseId/lesson/create" element={
                        <PrivateRoute>
                            <Layout><LessonCreate /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/courses/:courseId/lesson/edit/:lessonId" element={
                        <PrivateRoute>
                            <Layout><LessonEdit /></Layout>
                        </PrivateRoute>
                    } />
                    
                    {/* LESSON PLAYER - PUBLIC ROUTE */}
                    <Route path="/courses/:courseId/lesson/:lessonId" element={<LessonPlayer />} />

                    {/* DEFAULT */}
                    <Route path="*" element={<Navigate to="/courses" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;