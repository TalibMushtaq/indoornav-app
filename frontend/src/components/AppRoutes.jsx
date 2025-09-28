import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Hero from './Hero';
import About from './About';
import Feedback from './Feedback';
import Contact from './Contact';
import AdminSignIn from './AdminSignIn';
import AdminSignUp from './AdminSignUp';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <>
          <Hero />
          <About />
          <Feedback />
          <Contact />
        </>
      } />
      <Route path="/admin/signin" element={<AdminSignIn />} />
      <Route path="/admin/signup" element={<AdminSignUp />} />
    </Routes>
  );
};

export default AppRoutes;