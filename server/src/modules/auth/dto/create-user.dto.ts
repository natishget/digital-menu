import { IsString, IsEnum, MinLength, IsEmpty, IsNotEmpty, IsOptional } from "class-validator";
import { Role } from "@prisma/client";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}