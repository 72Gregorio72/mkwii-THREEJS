import { Controller, Get } from '@nestjs/common';
import { InfoService } from './info.service';

@Controller('info') // Questo corrisponde a location /info in nginx
export class InfoController {
    constructor(private readonly infoService : InfoService) {}

    @Get('') 
    getInfo(){
        // Restituiamo un unico oggetto JSON pulito
        return {
            tos: this.infoService.getTos(),
            privacy: this.infoService.getPrivacy()
        };
    }
}