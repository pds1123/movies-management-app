import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import LandingPage from "./features/home/components/LandingPage";
import HandleRouteNotFound from "./features/home/components/HandleRouteNotFound";
import ProtectRoute from "./features/security/components/ProtectRoute";
import Loading from "./components/Loading";

const IndexGenres = lazy(() => import("./features/genres/components/IndexGenres"));
const CreateGenre = lazy(() => import("./features/genres/components/CreateGenre"));
const EditGenre = lazy(() => import("./features/genres/components/EditGenre"));
const FilterMovies = lazy(() => import("./features/movies/components/FilterMovies"));
const MovieDetail = lazy(() => import("./features/movies/components/MovieDetail"));
const CreateMovie = lazy(() => import("./features/movies/components/CreateMovie"));
const EditMovie = lazy(() => import("./features/movies/components/EditMovie"));
const IndexActors = lazy(() => import("./features/actors/components/IndexActors"));
const CreateActor = lazy(() => import("./features/actors/components/CreateActor"));
const EditActor = lazy(() => import("./features/actors/components/EditActor"));
const IndexTheaters = lazy(() => import("./features/theaters/components/IndexTheaters"));
const CreateTheater = lazy(() => import("./features/theaters/components/CreateTheater"));
const EditTheater = lazy(() => import("./features/theaters/components/EditTheater"));
const Register = lazy(() => import("./features/security/components/Register"));
const Login = lazy(() => import("./features/security/components/Login"));
const IndexUsers = lazy(() => import("./features/security/components/IndexUsers"));
const MyBookings = lazy(() => import("./features/bookings/components/MyBookings"));
const MembershipPage = lazy(() => import("./features/membership/components/MembershipPage"));
const AboutPage = lazy(() => import("./features/about/components/AboutPage"));

export default function AppRoutes(){
    return (
        <Suspense fallback={<Loading />}>
        <Routes>
            <Route path='/' element={<LandingPage />} />

            <Route element={<ProtectRoute claims={['isadmin']} />}>
                <Route path='/genres' element={<IndexGenres />} />
                <Route path='/genres/create' element={<CreateGenre />} />
                <Route path='/genres/edit/:id' element={<EditGenre />} />

                <Route path='/actors' element={<IndexActors />} />
                <Route path='/actors/create' element={<CreateActor />} />
                <Route path='/actors/edit/:id' element={<EditActor />} />

                <Route path='/theaters' element={<IndexTheaters />} />
                <Route path='/theaters/create' element={<CreateTheater />} />
                <Route path='/theaters/edit/:id' element={<EditTheater />} />

                <Route path='/movies/create' element={<CreateMovie />} />
                <Route path='/movies/edit/:id' element={<EditMovie />} />
                <Route path="/users" element={<IndexUsers /> } />
            </Route>

            <Route path='/movies/filter' element={<FilterMovies />} />
            <Route path='/movie/:id' element={<MovieDetail />} />
            <Route path='/membership' element={<MembershipPage />} />
            <Route path='/about' element={<AboutPage />} />

            <Route element={<ProtectRoute />}>
                <Route path="/bookings" element={<MyBookings />} />
            </Route>

            <Route path="/register" element={<Register /> } />
            <Route path="/login" element={<Login /> } />

            


            <Route path='*' element={<HandleRouteNotFound />} />

        </Routes>
        </Suspense>
    )
}
