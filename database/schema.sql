
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` bigint DEFAULT NULL,
  `actor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_role` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `entity` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_id`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `complaint_drafts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_drafts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payload` longtext COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_draft_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `complaint_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_media` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `complaint_id` bigint NOT NULL,
  `content_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `data` mediumblob,
  `data_url` longtext COLLATE utf8mb4_unicode_ci,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_media_complaint_id` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `complaint_timeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_timeline` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `complaint_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by_role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_timeline_complaint_id` (`complaint_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `accuracy` double DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `area_colony` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `citizen_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `citizen_id` bigint NOT NULL,
  `citizen_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `citizen_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `closed_at` datetime(6) DEFAULT NULL,
  `complaint_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `department_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `district` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_emergency` bit(1) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `location_source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime(6) DEFAULT NULL,
  `sla_deadline` datetime(6) DEFAULT NULL,
  `sla_hours` int DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ulb_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ulb_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `ward_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_complaint_code` (`complaint_code`),
  KEY `idx_citizen_id` (`citizen_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contact` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `dept_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `extra_json` text COLLATE utf8mb4_unicode_ci,
  `head` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `officer` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_dept_name` (`name`),
  UNIQUE KEY `UKc4lbmtoqk0strakiavxuedrs5` (`dept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `emergencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergencies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `emergency_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `extra_json` text COLLATE utf8mb4_unicode_ci,
  `invalid_reason` text COLLATE utf8mb4_unicode_ci,
  `latitude` double DEFAULT NULL,
  `location` text COLLATE utf8mb4_unicode_ci,
  `longitude` double DEFAULT NULL,
  `officer_handshake` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_data_url` longtext COLLATE utf8mb4_unicode_ci,
  `reporter_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporter_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporter_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporter_role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_emergency_code` (`emergency_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `complaint_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `rating` int NOT NULL,
  `user_id` bigint NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_feedback_complaint` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `complaint_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_read` bit(1) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `portal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `department_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extra_json` text COLLATE utf8mb4_unicode_ci,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tasks_count` int NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

