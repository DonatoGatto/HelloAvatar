INSERT INTO avatars (id, name, type, status, "thumbnailUrl", "heygenAvatarId", "workspaceId", "createdAt", "updatedAt")
VALUES 
  (
    'demo-anna-mycompany',
    'Anna (Demo)',
    'STOCK',
    'READY',
    'https://files.heygen.ai/avatar/v3/37f4a2e9a3e647928f44b8c99a02aebb_1/full/2.2/preview_target.webp',
    'Anna_public_3_20240108',
    'cmmq16uyh000213rfozbypy9z',
    NOW(),
    NOW()
  ),
  (
    'demo-tyler-mycompany',
    'Tyler (Demo)',
    'STOCK',
    'READY',
    'https://files.heygen.ai/avatar/v3/3aa2b0c2e57d4b478b0ae6e4b01f1193_1/full/2.2/preview_target.webp',
    'Tyler_public_2_20240108',
    'cmmq16uyh000213rfozbypy9z',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
