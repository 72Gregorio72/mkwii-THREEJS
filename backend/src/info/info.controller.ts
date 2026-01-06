import { Controller, Get } from '@nestjs/common';
import { InfoService } from './info.service';

@Controller('info')
export class InfoController {
	constructor(private readonly infoService : InfoService) {}

	@Get('tos')
	getTos(){
		return this.infoService.getTos();
	}

	@Get('Privacy')
	getPrivacy(){
		return this.infoService.getPrivacy();
	}
}
