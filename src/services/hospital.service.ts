import { CreateHospitalDto, UpdateHospitalDto } from "../dtos/hospital.dto";
import { HttpError } from "../errors/http-error";
import { HospitalRepository } from "../repositories/hospital.repository";

let hospitalRepository = new HospitalRepository();

export class HospitalService {

    async getHospitalById(hospitalId: String) {
        const hospital = await hospitalRepository.getHospitalById(hospitalId);
        if (!hospital) {
            throw new HttpError(404, "Hospital not found");
        }
        return hospital;
    }

    async getAllHospitals({ page, size, search, isActive, }: { page?: string | undefined; size?: string | undefined; search?: string | undefined; isActive?: string | undefined; }) {
        const currentPage = page ? parseInt(page) : 1;
        const currentSize = size ? parseInt(size) : 10;
        const currentSearch = search || "";

        let currentIsActive: boolean | undefined = undefined;
        if (isActive === "true") currentIsActive = true;
        if (isActive === "false") currentIsActive = false;

        const { hospitals, totalHospitals } = await hospitalRepository.getAllHospitals({
            page: currentPage,
            size: currentSize,
            search: currentSearch,
            isActive: currentIsActive,
        });
        const pagination = {
            page: currentPage,
            size: currentSize,
            total: totalHospitals,
            totalPages: Math.ceil(totalHospitals / currentSize),
        };

        return { hospitals, pagination };
    }
}