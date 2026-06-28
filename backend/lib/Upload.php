<?php
/**
 * Image Upload Handler
 *
 * Handles multipart image uploads with validation for MIME type,
 * file size, and magic bytes. Saves files with random hashed filenames
 * into date-based subdirectories.
 */
class Upload
{
    /**
     * Dangerous magic bytes that indicate executable content.
     */
    private static array $dangerousSignatures = [
        '<?php',
        '<?=',
        '<script',
        '#!/',
        '\x00',
    ];

    /**
     * Valid image magic bytes (file signatures).
     */
    private static array $imageSignatures = [
        "\xFF\xD8\xFF"         => 'image/jpeg',   // JPEG
        "\x89\x50\x4E\x47"    => 'image/png',     // PNG
        "RIFF"                 => 'image/webp',    // WebP (RIFF....WEBP)
    ];

    /**
     * Process one avatar image with the same server-side validation as listing images.
     */
    public static function handleAvatarUpload(array $file): string
    {
        $fileList = self::normalizeFiles($file);

        if (empty($fileList)) {
            Response::error('No avatar file uploaded', 400);
        }

        if (count($fileList) > 1) {
            Response::error('Only one avatar file is allowed', 400);
        }

        $avatar = $fileList[0];
        if ($avatar['error'] !== UPLOAD_ERR_OK) {
            $errorMsg = self::getUploadErrorMessage($avatar['error']);
            Response::error("Avatar upload failed: {$errorMsg}", 400);
        }

        $maxSize = defined('UPLOAD_AVATAR_MAX_SIZE') ? UPLOAD_AVATAR_MAX_SIZE : (5 * 1024 * 1024);
        if ($avatar['size'] > $maxSize) {
            $maxMB = $maxSize / (1024 * 1024);
            Response::error("Avatar exceeds maximum size of {$maxMB}MB", 400);
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($avatar['tmp_name']);
        $allowedTypes = defined('UPLOAD_AVATAR_ALLOWED_TYPES')
            ? UPLOAD_AVATAR_ALLOWED_TYPES
            : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!in_array($mimeType, $allowedTypes, true)) {
            Response::error("Avatar has invalid type '{$mimeType}'. Allowed: jpg, png, webp", 400);
        }

        self::validateMagicBytes($avatar['tmp_name'], $avatar['name']);

        return self::storeUploadedFile($avatar, self::getExtensionFromMime($mimeType), 'avatars');
    }

    /**
     * Process one uploaded video file.
     *
     * @param array $file The $_FILES['video'] array
     * @return string Public URL for the uploaded video
     */
    public static function handleVideoUpload(array $file): string
    {
        $fileList = self::normalizeFiles($file);

        if (empty($fileList)) {
            Response::error('No video was uploaded', 400);
        }

        if (count($fileList) > 1) {
            Response::error('Only one video file is allowed per listing', 400);
        }

        $video = $fileList[0];
        if ($video['error'] !== UPLOAD_ERR_OK) {
            $errorMsg = self::getUploadErrorMessage($video['error']);
            Response::error("Video upload failed: {$errorMsg}", 400);
        }

        $maxSize = defined('UPLOAD_VIDEO_MAX_SIZE') ? UPLOAD_VIDEO_MAX_SIZE : (120 * 1024 * 1024);
        if ($video['size'] > $maxSize) {
            $maxMB = $maxSize / (1024 * 1024);
            Response::error("Video '{$video['name']}' exceeds maximum size of {$maxMB}MB", 400);
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($video['tmp_name']);
        $allowedTypes = defined('UPLOAD_VIDEO_ALLOWED_TYPES')
            ? UPLOAD_VIDEO_ALLOWED_TYPES
            : ['video/mp4', 'video/quicktime', 'video/webm'];

        if (!in_array($mimeType, $allowedTypes, true)) {
            Response::error(
                "Video '{$video['name']}' has invalid type '{$mimeType}'. Allowed: mp4, mov, webm",
                400
            );
        }

        self::validateVideoMagicBytes($video['tmp_name'], $video['name']);

        return self::storeUploadedFile($video, self::getVideoExtensionFromMime($mimeType), 'videos');
    }

    /**
     * Process uploaded image files.
     *
     * @param array $files The $_FILES['images'] array (single or multiple)
     * @return array Array of public URLs for the uploaded files
     */
    public static function handleUpload(array $files): array
    {
        $urls = [];

        // Normalize $_FILES array for both single and multiple uploads
        $fileList = self::normalizeFiles($files);

        if (empty($fileList)) {
            Response::error('No files were uploaded', 400);
        }

        foreach ($fileList as $file) {
            // Check for upload errors
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $errorMsg = self::getUploadErrorMessage($file['error']);
                Response::error("Upload failed: {$errorMsg}", 400);
            }

            // Validate file size (default 20 MB if not configured)
            $maxSize = defined('UPLOAD_MAX_SIZE') ? UPLOAD_MAX_SIZE : (20 * 1024 * 1024);
            if ($file['size'] > $maxSize) {
                $maxMB = $maxSize / (1024 * 1024);
                Response::error("File '{$file['name']}' exceeds maximum size of {$maxMB}MB", 400);
            }

            // Validate MIME type via finfo (server-side check)
            $finfo    = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($file['tmp_name']);

            if (!in_array($mimeType, UPLOAD_ALLOWED_TYPES, true)) {
                Response::error(
                    "File '{$file['name']}' has invalid type '{$mimeType}'. Allowed: jpg, png, webp",
                    400
                );
            }

            // Validate magic bytes to reject disguised executables
            self::validateMagicBytes($file['tmp_name'], $file['name']);

            $extension = self::getExtensionFromMime($mimeType);

            $urls[] = self::storeUploadedFile($file, $extension);
        }

        return $urls;
    }

    /**
     * Store an already validated uploaded file.
     */
    private static function storeUploadedFile(array $file, string $extension, string $folder = ''): string
    {
        $filename = uniqid() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
        $subDir = trim(($folder ? $folder . '/' : '') . date('Y') . '/' . date('m'), '/');
        $uploadBase = dirname(__DIR__) . '/uploads';
        $targetDir = $uploadBase . '/' . $subDir;

        if (!is_dir($targetDir)) {
            if (!mkdir($targetDir, 0755, true)) {
                Response::error('Failed to create upload directory', 500);
            }
        }

        $targetPath = $targetDir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            Response::error("Failed to save file '{$file['name']}'", 500);
        }

        return BASE_URL . '/uploads/' . $subDir . '/' . $filename;
    }

    /**
     * Normalize the $_FILES array to a consistent list of file entries.
     *
     * @param array $files
     * @return array
     */
    private static function normalizeFiles(array $files): array
    {
        $fileList = [];

        // Check if it's a multi-file upload (arrays within the array)
        if (isset($files['name']) && is_array($files['name'])) {
            $count = count($files['name']);
            for ($i = 0; $i < $count; $i++) {
                if ($files['error'][$i] === UPLOAD_ERR_NO_FILE) {
                    continue;
                }
                $fileList[] = [
                    'name'     => $files['name'][$i],
                    'type'     => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error'    => $files['error'][$i],
                    'size'     => $files['size'][$i],
                ];
            }
        } elseif (isset($files['name'])) {
            // Single file upload
            if ($files['error'] !== UPLOAD_ERR_NO_FILE) {
                $fileList[] = $files;
            }
        }

        return $fileList;
    }

    /**
     * Validate file magic bytes — reject PHP/scripts disguised as images.
     *
     * @param string $tmpPath   Path to the temp file
     * @param string $fileName  Original filename for error messages
     */
    private static function validateMagicBytes(string $tmpPath, string $fileName): void
    {
        $handle = fopen($tmpPath, 'rb');
        if (!$handle) {
            Response::error("Cannot read file '{$fileName}'", 500);
        }

        $header = fread($handle, 256);
        fclose($handle);

        if ($header === false || strlen($header) < 4) {
            Response::error("File '{$fileName}' is too small or unreadable", 400);
        }

        // Check for dangerous content in the first 256 bytes
        $headerLower = strtolower($header);
        foreach (self::$dangerousSignatures as $sig) {
            if (strpos($headerLower, strtolower($sig)) !== false) {
                Response::error("File '{$fileName}' contains suspicious content", 400);
            }
        }

        // Verify file starts with a known image signature
        $validImage = false;
        foreach (self::$imageSignatures as $bytes => $mime) {
            if (strncmp($header, $bytes, strlen($bytes)) === 0) {
                // Extra check for WebP: verify WEBP marker at offset 8
                if ($bytes === "RIFF" && strlen($header) >= 12) {
                    if (substr($header, 8, 4) !== 'WEBP') {
                        continue;
                    }
                }
                $validImage = true;
                break;
            }
        }

        if (!$validImage) {
            Response::error("File '{$fileName}' does not have valid image headers", 400);
        }
    }

    /**
     * Validate video magic bytes for MP4/MOV/WebM and reject scripts.
     */
    private static function validateVideoMagicBytes(string $tmpPath, string $fileName): void
    {
        $handle = fopen($tmpPath, 'rb');
        if (!$handle) {
            Response::error("Cannot read video '{$fileName}'", 500);
        }

        $header = fread($handle, 256);
        fclose($handle);

        if ($header === false || strlen($header) < 12) {
            Response::error("Video '{$fileName}' is too small or unreadable", 400);
        }

        $headerLower = strtolower($header);
        foreach (self::$dangerousSignatures as $sig) {
            if (strpos($headerLower, strtolower($sig)) !== false) {
                Response::error("Video '{$fileName}' contains suspicious content", 400);
            }
        }

        $isMp4OrMov = substr($header, 4, 4) === 'ftyp';
        $isWebm = strncmp($header, "\x1A\x45\xDF\xA3", 4) === 0;

        if (!$isMp4OrMov && !$isWebm) {
            Response::error("Video '{$fileName}' does not have valid video headers", 400);
        }
    }

    /**
     * Get file extension from MIME type.
     *
     * @param string $mime
     * @return string
     */
    private static function getExtensionFromMime(string $mime): string
    {
        $map = [
            'image/jpeg' => 'jpg',
            'image/jpg'  => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];

        return $map[$mime] ?? 'jpg';
    }

    /**
     * Get video extension from MIME type.
     */
    private static function getVideoExtensionFromMime(string $mime): string
    {
        $map = [
            'video/mp4'       => 'mp4',
            'video/mpeg'      => 'mpg',
            'video/quicktime' => 'mov',
            'video/webm'      => 'webm',
            'video/x-m4v'     => 'm4v',
        ];

        return $map[$mime] ?? 'mp4';
    }

    /**
     * Get a human-readable upload error message.
     *
     * @param int $errorCode
     * @return string
     */
    private static function getUploadErrorMessage(int $errorCode): string
    {
        $messages = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds MAX_FILE_SIZE in form',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary directory on server',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION  => 'Upload blocked by a PHP extension',
        ];

        return $messages[$errorCode] ?? 'Unknown upload error';
    }
}
