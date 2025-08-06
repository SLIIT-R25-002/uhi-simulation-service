% matlabSimulation.m - Entry point for Node.js
try
    % Get input path from environment variable
    inputPath = getenv('SIM_INPUT_PATH');
    if isempty(inputPath) || ~isfile(inputPath)
        error('Input CSV file not found: %s', inputPath);
    end

    % Add current directory (where script is running) to path
    projectDir = pwd; % Current working directory
    addpath(projectDir);
    disp(['📁 Added to path: ', projectDir]);

    % Read input data
    disp(['📄 Reading input: ', inputPath]);
    data = readtable(inputPath);

    % Load Simulink model
    modelName = 'ThermalSimModel';
    if ~bdIsLoaded(modelName)
        disp(['🔄 Loading model: ', modelName]);
        load_system(modelName);
    else
        disp(['🔁 Model already loaded: ', modelName]);
    end

    % Preallocate results
    n = height(data);
    results = zeros(n, 1);

    % Simulation loop
    for i = 1:n
        % Extract parameters
        T_ext = data.Temperature(i);
        Area = data.Area(i);
        Thickness = data.Thickness_m_(i);
        k = data.Thermal_Conductivity_W_m_K_(i);
        c = data.Specific_Heat_Capacity_J_kg_K_(i);
        m = data.Mass(i);
        exposure = data.Sun_Exposure(i) / 100;
        humidity = data.Humidity(i);
        wind = data.Wind_Speed(i);

        % Convective heat transfer coefficient
        h_base = 584;
        h_humidity = h_base * (1 + 0.002 * (humidity - 50));
        h = h_humidity * (1 + 0.05 * wind);

        % Derived parameters
        R_cond = Thickness / (k * Area);
        solar_constant = 1000;
        Q_solar = Area * solar_constant * exposure;

        % Set Simulink parameters
        set_param([modelName '/WallSubsystem/Temperature Source'], 'Temperature', num2str(T_ext));
        set_param([modelName '/WallSubsystem/Convective Heat Transfer'], 'Area', num2str(Area), 'heat_tr_coeff', num2str(h));
        set_param([modelName '/WallSubsystem/ConductiveBlock'], 'Area', num2str(Area), 'Thickness', num2str(Thickness), 'th_cond', num2str(k));
        set_param([modelName '/WallSubsystem/Thermal Resistance'], 'Resistance', num2str(R_cond));
        set_param([modelName '/WallSubsystem/Thermal Mass'], 'Mass', num2str(m), 'sp_heat', num2str(c));
        set_param([modelName '/WallSubsystem/PS Constant'], 'constant', num2str(Q_solar));

        % Run simulation
        simOut = sim(modelName, 'StopTime', '3600');
        out_temp = simOut.get('wall_temp');
        final_temp = out_temp(end);
        results(i) = final_temp;

        fprintf('✅ Object %d (%s): Final Temp = %.2f degC\n', i, data.ObjectName{i}, final_temp);
    end

        % Save results
        data.FinalWallTemperature_C = results;
        output_path = fullfile(projectDir, 'results', 'simulation_results.csv');
        writetable(data, output_path);
        disp(['📁 Results saved to ', output_path]);

        % Close model and discard changes
        if bdIsLoaded(modelName)
            close_system(modelName, 0); % 0 = don't save
        end

        % Success
        exit(0);

    catch ME
        fprintf('❌ MATLAB Error: %s\n', ME.message);

        % Ensure model is closed even on error
        if bdIsLoaded(modelName)
            close_system(modelName, 0);
        end

        exit(1);
    end