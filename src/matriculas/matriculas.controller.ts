import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MatriculasService } from './matriculas.service';
import { MatriculaResponseDto } from './dto/matricula-response.dto';

@ApiTags('matriculas')
@Controller('matriculas')
export class MatriculasController {
  constructor(private readonly service: MatriculasService) {}

  @Get(':id')
  @ApiOkResponse({ type: MatriculaResponseDto })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('responsavel/:responsavelId')
  @ApiOkResponse({ type: MatriculaResponseDto, isArray: true })
  listByResponsavel(@Param('responsavelId') responsavelId: string) {
    return this.service.listByResponsavel(responsavelId);
  }
}
