// test-create.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const newUser = await prisma.user.create({
      data: {
        username: 'pisello',
        email: 'pisellone@test.com',
        password: 'superpassword',
      },
    })
    console.log('Utente creato con successo:', newUser)
  } catch (e) {
    console.error('Errore durante la creazione:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()