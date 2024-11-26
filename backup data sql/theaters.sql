-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 25, 2024 at 10:26 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cinema`
--

-- --------------------------------------------------------

--
-- Table structure for table `theaters`
--

CREATE TABLE `theaters` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `contact` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `theaters`
--

INSERT INTO `theaters` (`id`, `name`, `location`, `city`, `contact`) VALUES
(1, 'XXI Grand Metropolitan Bekasi', 'Grand Metropolitan Mall, Lantai 3, Jl. Raya Timu No.1', 'Bekasi', '021-29863423'),
(2, 'Cinepolis Bekasi', 'Summarecon Mall Bekasi, Lantai 2', 'Bekasi', '021-88890001'),
(3, 'CGV Bekasi', 'Revo Town, Jl. Raya Pekayon Indah No. 1', 'Bekasi', '021-87760600'),
(4, '21 Cineplex Bekasi', 'Mega Bekasi Hypermall, Lantai 3', 'Bekasi', '021-89000432'),
(5, 'Cinema XXI Blu Plaza', 'Blu Plaza, Jl. Ir. H. Juanda No. 33', 'Bekasi', '021-80910332'),
(6, 'Cinepolis Plaza Senayan', 'Plaza Senayan, Lantai 3, Jl. Asia Afrika No. 8', 'Jakarta', '021-5730155'),
(7, 'XXI Pondok Indah Mall', 'Pondok Indah Mall 2, Lantai 3, Jl. Metro Pondok Indah', 'Jakarta', '021-75914452'),
(8, 'CGV Pacific Place', 'Pacific Place Mall, Lantai 3, Jl. Jenderal Sudirman No. 52-53', 'Jakarta', '021-5159000'),
(9, 'Cineplex 21 Taman Anggrek', 'Taman Anggrek Mall, Lantai 3, Jl. S. Parman No. 21', 'Jakarta', '021-56966525'),
(10, 'Cinema XXI Kemang Village', 'Kemang Village Mall, Lantai 2, Jl. Kemang Raya No. 88', 'Jakarta', '021-29018888');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `theaters`
--
ALTER TABLE `theaters`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `theaters`
--
ALTER TABLE `theaters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
