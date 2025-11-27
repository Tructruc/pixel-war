import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
    const templatePath = path.join(__dirname, '../../frontend/src/agent/imported_template.json');

    if (!fs.existsSync(templatePath)) {
        console.error(`Template file not found at ${templatePath}`);
        process.exit(1);
    }

    const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
    console.log(`Loaded template with ${template.pixels.length} pixels.`);

    // Center the template
    const targetX = 512;
    const targetY = 512;
    const originX = Math.floor(targetX - template.width / 2);
    const originY = Math.floor(targetY - template.height / 2);

    console.log(`Drawing at origin (${originX}, ${originY})...`);

    const pixelsToInsert = template.pixels.map(p => ({
        x: originX + p.x,
        y: originY + p.y,
        color: p.color,
        placedAt: new Date()
    })).filter(p => p.x >= 0 && p.x <= 1023 && p.y >= 0 && p.y <= 1023);

    console.log(`Valid pixels to insert: ${pixelsToInsert.length}`);

    // Use transaction for speed and atomicity
    // Prisma createMany is not supported for SQLite with upsert semantics easily, 
    // but we can use a loop with upsert or delete/create.
    // Since we want to overwrite, let's use a loop of upserts or Promise.all.
    // SQLite might lock if we do too many parallel, so let's do chunks.

    const CHUNK_SIZE = 500;
    for (let i = 0; i < pixelsToInsert.length; i += CHUNK_SIZE) {
        const chunk = pixelsToInsert.slice(i, i + CHUNK_SIZE);

        await prisma.$transaction(
            chunk.map(p =>
                prisma.canva.upsert({
                    where: { x_y: { x: p.x, y: p.y } },
                    create: { x: p.x, y: p.y, color: p.color, placedAt: p.placedAt },
                    update: { color: p.color, placedAt: p.placedAt }
                })
            )
        );
        process.stdout.write(`\rProcessed ${Math.min(i + CHUNK_SIZE, pixelsToInsert.length)} / ${pixelsToInsert.length}`);
    }

    console.log('\nDone!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
