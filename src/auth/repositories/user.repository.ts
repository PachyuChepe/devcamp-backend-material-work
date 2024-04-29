// src/auth/repositories/user.repository.ts
import { Injectable } from '@nestjs/common'; // 클래스를 서비스로 등록하기 위한 데코레이터
import { EntityManager, Repository } from 'typeorm'; // TypeORM의 EntityManager와 Repository 클래스
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'; // TypeORM 엔티티와 리포지토리 주입을 위한 데코레이터
import { User } from '../entities'; // 사용자 엔티티
import { CreateUserDto } from '../dto'; // 데이터 전송 객체(Data Transfer Object)

@Injectable()
export class UserRepository extends Repository<User> {
  // UserRepository 클래스의 생성자
  constructor(
    @InjectRepository(User) // User 엔티티에 대한 리포지토리를 주입받음
    private readonly repo: Repository<User>,
    @InjectEntityManager() // 엔티티 매니저를 주입 받으며, 엔티티 매니저는 엔티티를 관리하고, 데이터베이스 작업을 수행하는 데 사용
    private readonly entityManager: EntityManager,
  ) {
    super(repo.target, repo.manager, repo.queryRunner); // 상위 클래스인 Repository의 생성자를 호출하여 초기화
  }

  // 이메일을 기준으로 하나의 사용자를 찾는 비동기 메소드
  async findOneByEmail(email: string): Promise<User> {
    return this.repo.findOneBy({ email }); // 주어진 이메일로 사용자를 찾아 반환
  }

  // 새 사용자를 생성하는 비동기 메소드
  async createUser(dto: CreateUserDto, hashedPassword: string): Promise<User> {
    const user = new User(); // 새 User 인스턴스를 생성
    user.name = dto.name; // DTO에서 받은 이름을 사용자 객체에 설정
    user.email = dto.email; // DTO에서 받은 이메일을 사용자 객체에 설정
    user.password = hashedPassword; // 해시된 비밀번호를 사용자 객체에 설정
    user.phone = dto.phone; // DTO에서 받은 전화번호를 사용자 객체에 설정
    user.role = dto.role; // DTO에서 받은 역할을 사용자 객체에 설정
    return this.repo.save(user); // 사용자 객체를 데이터베이스에 저장하고 저장된 객체를 반환
  }
}
