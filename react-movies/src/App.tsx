import { BrowserRouter } from "react-router";
import Menu from "./features/home/components/Menu";
import AppRoutes from "./AppRoutes";
import AuthenticationContext from "./features/security/utils/AuthenticationContext";
import { useState, useEffect } from "react";
import type Claim from "./features/security/models/Claim.model";
import { getClaims } from "./features/security/utils/HandleJWT"
import "./App.css";

function App() {

  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    setClaims(getClaims());
  }, [])

  function updateClaims(claims: Claim[]){
    setClaims(claims);
  }

  
  return (
    <BrowserRouter>
      <AuthenticationContext.Provider value={{claims, update: updateClaims}}>
        <Menu />
          <main className="site-main">
            <div className="site-container">
              <AppRoutes />
            </div>
          </main>
      </AuthenticationContext.Provider>
    </BrowserRouter>
  )
}


export default App
