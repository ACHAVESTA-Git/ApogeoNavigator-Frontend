import { QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "motion/react";
import { useState } from "react";
import { BrowserRouter } from "react-router";
import { crearQueryClient } from "./lib/queryClient";
import { Rutas } from "./rutas";

export default function App() {
  const [queryClient] = useState(crearQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domMax} strict>
        <BrowserRouter>
          <Rutas />
        </BrowserRouter>
      </LazyMotion>
    </QueryClientProvider>
  );
}
