import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GosacService } from './gosac.service';

@Module({
    imports: [ConfigModule],
    providers: [GosacService],
    exports: [GosacService]
})
export class GosacModule { }
